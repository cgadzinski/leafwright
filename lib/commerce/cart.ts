import type {
  Cart,
  CartLine,
  Product,
  ProductVariant,
  Promo,
  ShippingMethod,
} from "@/lib/db/schema";
import { evaluatePromo, promoDiscount, promoShipping } from "./promo";

export const SHIPPING_RATES: Record<ShippingMethod, number> = {
  standard: 799,
  express: 1499,
};

/** Standard shipping is free for a store's items once their discounted subtotal reaches this. */
export const FREE_STANDARD_SHIPPING_THRESHOLD = 7500;

export const TAX_RATE = 0.08;

export interface PricedLine {
  line: CartLine;
  product: Product;
  variant?: ProductVariant;
  unitPrice: number;
  lineTotal: number;
}

export interface StoreGroup {
  storeId: string;
  lines: PricedLine[];
  promo?: Promo;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface CartTotals {
  groups: StoreGroup[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  /** Lines dropped because their product is unavailable. */
  unavailable: CartLine[];
}

export function findVariant(product: Product, variantId?: string): ProductVariant | undefined {
  if (!variantId) return undefined;
  return product.variants.find((variant) => variant.id === variantId);
}

export function unitPrice(product: Product, variant?: ProductVariant): number {
  return product.price + (variant?.priceDelta ?? 0);
}

export function shippingFor(method: ShippingMethod, discountedSubtotal: number): number {
  if (method === "standard" && discountedSubtotal >= FREE_STANDARD_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_RATES[method];
}

export function taxFor(discountedSubtotal: number): number {
  return Math.round(discountedSubtotal * TAX_RATE);
}

export interface PriceCartInput {
  lines: CartLine[];
  products: Product[];
  promo?: Promo;
  shippingMethod?: ShippingMethod;
  now?: Date;
}

/**
 * Prices a cart. Lines are grouped by store because each store ships and invoices
 * separately; a promo only touches the lines of the store that issued it.
 */
export function priceCart({
  lines,
  products,
  promo,
  shippingMethod = "standard",
  now = new Date(),
}: PriceCartInput): CartTotals {
  const byId = new Map(products.map((product) => [product.id, product]));
  const activePromo = promo && evaluatePromo(promo, now).ok ? promo : undefined;
  const groups = new Map<string, StoreGroup>();
  const unavailable: CartLine[] = [];

  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product || product.status !== "published") {
      unavailable.push(line);
      continue;
    }
    const variant = findVariant(product, line.variantId);
    const price = unitPrice(product, variant);
    const priced: PricedLine = {
      line,
      product,
      variant,
      unitPrice: price,
      lineTotal: price * line.quantity,
    };
    const group = groups.get(product.storeId) ?? {
      storeId: product.storeId,
      lines: [],
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
    };
    group.lines.push(priced);
    group.subtotal += priced.lineTotal;
    groups.set(product.storeId, group);
  }

  for (const group of groups.values()) {
    if (activePromo && activePromo.storeId === group.storeId) {
      group.promo = activePromo;
      group.discount = promoDiscount(activePromo, group.subtotal);
    }
    const discounted = group.subtotal - group.discount;
    group.shipping = shippingFor(shippingMethod, discounted);
    if (group.promo) group.shipping = promoShipping(group.promo, group.shipping);
    group.tax = taxFor(discounted);
    group.total = discounted + group.shipping + group.tax;
  }

  const list = [...groups.values()];
  const sum = (pick: (group: StoreGroup) => number) =>
    list.reduce((acc, group) => acc + pick(group), 0);

  return {
    groups: list,
    itemCount: list.reduce(
      (acc, group) => acc + group.lines.reduce((n, priced) => n + priced.line.quantity, 0),
      0,
    ),
    subtotal: sum((g) => g.subtotal),
    discount: sum((g) => g.discount),
    shipping: sum((g) => g.shipping),
    tax: sum((g) => g.tax),
    total: sum((g) => g.total),
    unavailable,
  };
}

// Line manipulation. A cart holds one line per product; choosing a different pot
// size for a product already in the cart updates that line.

export function addLine(
  lines: CartLine[],
  productId: string,
  quantity: number,
  variantId?: string,
): CartLine[] {
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) return [...lines, { productId, variantId, quantity }];
  return lines.map((line) =>
    line.productId === productId
      ? { productId, variantId: variantId ?? line.variantId, quantity: line.quantity + quantity }
      : line,
  );
}

export function setLineQuantity(
  lines: CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  if (quantity <= 0) return removeLine(lines, productId);
  return lines.map((line) => (line.productId === productId ? { ...line, quantity } : line));
}

export function removeLine(lines: CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.productId !== productId);
}

/** Merges an anonymous cart into a signed-in user's cart. The user's promo code wins. */
export function mergeCarts(anonymous: Cart, user: Cart): Cart {
  let lines = user.lines;
  for (const line of anonymous.lines) {
    lines = addLine(lines, line.productId, line.quantity, line.variantId);
  }
  return {
    ...user,
    lines,
    promoCode: user.promoCode ?? anonymous.promoCode,
    updatedAt: new Date().toISOString(),
  };
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
