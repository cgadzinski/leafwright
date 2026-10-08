"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { cartItemCount, getCart, priceStoredCart, saveCart } from "@/lib/cart/server";
import {
  addLine,
  findVariant,
  priceCart,
  removeLine,
  setLineQuantity,
  unitPrice,
} from "@/lib/commerce/cart";
import {
  evaluatePromo,
  PROMO_REJECTION_MESSAGES,
  describePromo,
  type PromoRejection,
} from "@/lib/commerce/promo";
import { db } from "@/lib/db";
import type { Cart, Promo, PromoType } from "@/lib/db/schema";
import { sessionIdentity, trackServerEvent } from "@/lib/pendo.server";

export interface CartActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  /** Why a promo code was turned down. */
  reason?: PromoRejection | "invalid_format";
  /** The promo that was applied and what it did to the cart. */
  promo?: AppliedPromo;
}

export interface AppliedPromo {
  code: string;
  promoType: PromoType;
  promoValue: number;
  promoStoreId: string;
  /** Cents taken off the merchandise subtotal. */
  discountAmount: number;
  /** False when the code changed nothing, e.g. the cart holds nothing from the issuing nursery. */
  reducedCart: boolean;
  cartSubtotal: number;
  cartItemCount: number;
}

type AddToCartSource = "product_page" | "quick_add";

const AddToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});

const LineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(20),
});

const PromoCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter a promo code.")
    .max(32)
    .transform((value) => value.toUpperCase()),
});

function revalidateCart() {
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

async function addProduct(formData: FormData, source: AddToCartSource): Promise<CartActionState> {
  const parsed = AddToCartSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId") || undefined,
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) return { error: "Choose a quantity between 1 and 20." };

  const product = await db.products.getById(parsed.data.productId);
  if (!product || product.status !== "published") return { error: "That product isn't available." };

  const variantId =
    parsed.data.variantId && findVariant(product, parsed.data.variantId)
      ? parsed.data.variantId
      : product.variants[0]?.id;

  const cart = await getCart();
  const updated = {
    ...cart,
    lines: addLine(cart.lines, product.id, parsed.data.quantity, variantId),
  };
  await saveCart(updated);
  revalidateCart();
  const variant = findVariant(product, variantId);
  trackServerEvent("Product Added to Cart", sessionIdentity(await auth()), {
    productId: product.id,
    productSlug: product.slug,
    category: product.category,
    storeId: product.storeId,
    variantId,
    variantLabel: variant?.label,
    quantity: parsed.data.quantity,
    unitPrice: unitPrice(product, variant),
    source,
    isNewLine: !cart.lines.some((line) => line.productId === product.id),
    cartItemCount: cartItemCount(updated),
  });
  return { ok: true, message: `Added ${product.name} to your cart.` };
}

export async function addToCart(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  return addProduct(formData, "product_page");
}

/** Quick add from a product card: no feedback state, the cart badge updates. */
export async function quickAddToCart(formData: FormData): Promise<void> {
  await addProduct(formData, "quick_add");
}

export async function updateCartLine(formData: FormData): Promise<void> {
  const parsed = LineSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return;
  const cart = await getCart();
  const previous = cart.lines.find((line) => line.productId === parsed.data.productId);
  const updated = {
    ...cart,
    lines: setLineQuantity(cart.lines, parsed.data.productId, parsed.data.quantity),
  };
  await saveCart(updated);
  revalidateCart();
  if (!previous || previous.quantity === parsed.data.quantity) return;
  trackServerEvent("Cart Quantity Updated", sessionIdentity(await auth()), {
    productId: parsed.data.productId,
    previousQuantity: previous.quantity,
    newQuantity: parsed.data.quantity,
    quantityDelta: parsed.data.quantity - previous.quantity,
    cartItemCount: cartItemCount(updated),
  });
}

export async function removeFromCart(formData: FormData): Promise<void> {
  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) return;
  const cart = await getCart();
  const removed = cart.lines.find((line) => line.productId === productId);
  const updated = { ...cart, lines: removeLine(cart.lines, productId) };
  await saveCart(updated);
  revalidateCart();
  if (!removed) return;
  const product = await db.products.getById(productId);
  trackServerEvent("Product Removed from Cart", sessionIdentity(await auth()), {
    productId,
    productSlug: product?.slug,
    category: product?.category,
    storeId: product?.storeId,
    variantId: removed.variantId,
    quantityRemoved: removed.quantity,
    remainingItemCount: cartItemCount(updated),
  });
}

/** What an applied promo does to the cart. A code only discounts the issuing nursery's items. */
async function promoEffect(cart: Cart, promo: Promo): Promise<AppliedPromo> {
  const { products, totals } = await priceStoredCart(cart);
  const withoutPromo = priceCart({ lines: cart.lines, products });
  return {
    code: promo.code,
    promoType: promo.type,
    promoValue: promo.value,
    promoStoreId: promo.storeId,
    discountAmount: totals.discount,
    reducedCart: totals.total < withoutPromo.total,
    cartSubtotal: totals.subtotal,
    cartItemCount: totals.itemCount,
  };
}

/** Shared by the cart form and the promo landing page. */
export async function applyPromoCode(code: string): Promise<CartActionState> {
  const parsed = PromoCodeSchema.safeParse({ code });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a promo code.",
      reason: "invalid_format",
    };
  }
  const promo = await db.promos.getByCode(parsed.data.code);
  const evaluation = evaluatePromo(promo);
  if (!evaluation.ok) {
    return { error: PROMO_REJECTION_MESSAGES[evaluation.reason], reason: evaluation.reason };
  }
  const cart = await getCart();
  const updated = { ...cart, promoCode: evaluation.promo.code };
  await saveCart(updated);
  revalidateCart();
  return {
    ok: true,
    message: `${evaluation.promo.code} applied: ${describePromo(evaluation.promo)}.`,
    promo: await promoEffect(updated, evaluation.promo),
  };
}

export async function applyPromo(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const code = formData.get("code");
  return applyPromoCode(typeof code === "string" ? code : "");
}

export async function removePromo(): Promise<void> {
  const cart = await getCart();
  await saveCart({ ...cart, promoCode: undefined });
  revalidateCart();
}
