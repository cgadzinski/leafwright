"use client";

import { Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { removeFromCart, updateCartLine } from "./actions";

export function CartLineControls({
  productId,
  slug,
  quantity,
}: {
  productId: string;
  slug: string;
  quantity: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-1 flex items-center gap-3">
      <form ref={formRef} action={updateCartLine} className="flex items-center gap-2">
        <input type="hidden" name="productId" value={productId} />
        <label className="text-sm text-muted-foreground" htmlFor={`cart-qty-${slug}`}>
          Qty
        </label>
        <select
          id={`cart-qty-${slug}`}
          name="quantity"
          defaultValue={quantity}
          onChange={() => formRef.current?.requestSubmit()}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          data-testid={`cart-qty-${slug}`}
        >
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </form>
      <form action={removeFromCart}>
        <input type="hidden" name="productId" value={productId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          data-testid={`cart-remove-${slug}`}
        >
          <Trash2 /> Remove
        </Button>
      </form>
    </div>
  );
}
