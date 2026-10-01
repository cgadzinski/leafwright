"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useActionState, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney, unitPrice } from "@/lib/commerce/cart";
import type { Product } from "@/lib/db/schema";
import type { CartActionState } from "../../cart/actions";

const SAVED_KEY = "leafwright:saved";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(SAVED_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parseSaved(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Slugs saved for later live in this browser only. */
function useSavedProducts(): [string[], (slug: string) => void] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const saved = parseSaved(raw);
  const toggle = (slug: string) => {
    const current = parseSaved(readRaw());
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      // Saving for later is a convenience; ignore storage failures.
    }
    listeners.forEach((listener) => listener());
  };
  return [saved, toggle];
}

export function PurchaseForm({
  product,
  action,
}: {
  product: Product;
  action: (prev: CartActionState, formData: FormData) => Promise<CartActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [savedSlugs, toggleSaved] = useSavedProducts();
  const saved = savedSlugs.includes(product.slug);
  const variant = product.variants.find((item) => item.id === variantId);
  const price = unitPrice(product, variant);
  const inStock = variant ? variant.inventory > 0 : product.inventory > 0;

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="variantId" value={variantId} />
      {product.variants.length ? (
        <div className="grid gap-1.5">
          <Label htmlFor="pdp-variant">Pot size</Label>
          <Select value={variantId} onValueChange={setVariantId}>
            <SelectTrigger id="pdp-variant" className="w-full sm:w-64" data-testid="pdp-variant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {product.variants.map((item) => (
                <SelectItem key={item.id} value={item.id} disabled={item.inventory === 0}>
                  {item.label}
                  {item.priceDelta ? ` (+${formatMoney(item.priceDelta)})` : ""}
                  {item.inventory === 0 ? " · sold out" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="pdp-quantity">Quantity</Label>
        <Input
          id="pdp-quantity"
          name="quantity"
          type="number"
          min={1}
          max={20}
          defaultValue={1}
          inputMode="numeric"
          className="w-24"
          data-testid="pdp-quantity"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={pending || !inStock}
          data-testid="pdp-add-to-cart"
        >
          {pending ? "Adding…" : inStock ? `Add to cart · ${formatMoney(price)}` : "Sold out"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={() => toggleSaved(product.slug)}
          aria-pressed={saved}
          data-testid="pdp-save"
        >
          {saved ? <BookmarkCheck /> : <Bookmark />}
          {saved ? "Saved" : "Save for later"}
        </Button>
      </div>
      {state.message ? (
        <p role="status" className="text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
