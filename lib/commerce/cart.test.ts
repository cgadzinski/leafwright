import { describe, expect, it } from "vitest";
import { makeCart, makeProduct, makePromo } from "./fixtures.test-helpers";
import {
  addLine,
  FREE_STANDARD_SHIPPING_THRESHOLD,
  mergeCarts,
  priceCart,
  removeLine,
  setLineQuantity,
  SHIPPING_RATES,
} from "./cart";

const now = new Date("2026-06-15T12:00:00.000Z");
const monstera = makeProduct();
const pot = makeProduct({
  id: "prod_2",
  storeId: "store_b",
  slug: "terracotta-pot",
  name: "Terracotta Pot",
  category: "planters",
  price: 1400,
  variants: [],
});

describe("priceCart", () => {
  it("prices an empty cart at zero", () => {
    const totals = priceCart({ lines: [], products: [], now });
    expect(totals).toMatchObject({ itemCount: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 });
  });

  it("uses the variant price delta and charges standard shipping under the threshold", () => {
    const totals = priceCart({
      lines: [{ productId: monstera.id, variantId: "6in", quantity: 1 }],
      products: [monstera],
      now,
    });
    expect(totals.subtotal).toBe(4400);
    expect(totals.shipping).toBe(SHIPPING_RATES.standard);
    expect(totals.tax).toBe(Math.round(4400 * 0.08));
    expect(totals.total).toBe(4400 + 799 + 352);
  });

  it("ships standard for free once a store's discounted subtotal reaches the threshold", () => {
    const totals = priceCart({
      lines: [{ productId: monstera.id, quantity: 3 }],
      products: [monstera],
      now,
    });
    expect(totals.subtotal).toBeGreaterThanOrEqual(FREE_STANDARD_SHIPPING_THRESHOLD);
    expect(totals.shipping).toBe(0);
  });

  it("always charges for express shipping", () => {
    const totals = priceCart({
      lines: [{ productId: monstera.id, quantity: 3 }],
      products: [monstera],
      shippingMethod: "express",
      now,
    });
    expect(totals.shipping).toBe(SHIPPING_RATES.express);
  });

  it("groups lines by store and charges shipping per store", () => {
    const totals = priceCart({
      lines: [
        { productId: monstera.id, quantity: 1 },
        { productId: pot.id, quantity: 2 },
      ],
      products: [monstera, pot],
      now,
    });
    expect(totals.groups.map((group) => group.storeId)).toEqual(["store_a", "store_b"]);
    expect(totals.itemCount).toBe(3);
    expect(totals.subtotal).toBe(3200 + 2800);
    expect(totals.shipping).toBe(SHIPPING_RATES.standard * 2);
  });

  it("applies a percent promo only to the issuing store's lines", () => {
    const totals = priceCart({
      lines: [
        { productId: monstera.id, quantity: 1 },
        { productId: pot.id, quantity: 1 },
      ],
      products: [monstera, pot],
      promo: makePromo({ storeId: "store_a", type: "percent", value: 15 }),
      now,
    });
    expect(totals.discount).toBe(480);
    const [a, b] = totals.groups;
    expect(a.discount).toBe(480);
    expect(b.discount).toBe(0);
    expect(a.tax).toBe(Math.round((3200 - 480) * 0.08));
  });

  it("zeroes shipping for the issuing store on a free_shipping promo", () => {
    const totals = priceCart({
      lines: [
        { productId: monstera.id, quantity: 1 },
        { productId: pot.id, quantity: 1 },
      ],
      products: [monstera, pot],
      promo: makePromo({ storeId: "store_b", type: "free_shipping", value: 0 }),
      now,
    });
    expect(totals.groups[0].shipping).toBe(SHIPPING_RATES.standard);
    expect(totals.groups[1].shipping).toBe(0);
  });

  it("ignores an expired promo", () => {
    const totals = priceCart({
      lines: [{ productId: monstera.id, quantity: 1 }],
      products: [monstera],
      promo: makePromo({ endsAt: "2026-01-02T00:00:00.000Z" }),
      now,
    });
    expect(totals.discount).toBe(0);
  });

  it("drops lines for missing or unpublished products", () => {
    const draft = makeProduct({ id: "prod_3", slug: "draft", status: "draft" });
    const totals = priceCart({
      lines: [
        { productId: monstera.id, quantity: 1 },
        { productId: draft.id, quantity: 1 },
        { productId: "gone", quantity: 1 },
      ],
      products: [monstera, draft],
      now,
    });
    expect(totals.itemCount).toBe(1);
    expect(totals.unavailable.map((line) => line.productId)).toEqual(["prod_3", "gone"]);
  });
});

describe("line helpers", () => {
  it("adds a new line and increments an existing one", () => {
    const once = addLine([], "prod_1", 1, "4in");
    const twice = addLine(once, "prod_1", 2, "6in");
    expect(twice).toEqual([{ productId: "prod_1", variantId: "6in", quantity: 3 }]);
  });

  it("keeps the existing variant when none is given", () => {
    const lines = addLine(addLine([], "prod_1", 1, "4in"), "prod_1", 1);
    expect(lines[0].variantId).toBe("4in");
  });

  it("sets quantity and removes at zero", () => {
    const lines = addLine([], "prod_1", 2);
    expect(setLineQuantity(lines, "prod_1", 5)[0].quantity).toBe(5);
    expect(setLineQuantity(lines, "prod_1", 0)).toEqual([]);
    expect(removeLine(lines, "prod_1")).toEqual([]);
  });
});

describe("mergeCarts", () => {
  it("sums quantities and keeps the user's promo code", () => {
    const anonymous = makeCart({
      lines: [
        { productId: "prod_1", quantity: 1 },
        { productId: "prod_9", quantity: 2 },
      ],
      promoCode: "ANON",
    });
    const user = makeCart({
      id: "cart_user",
      userId: "user_1",
      lines: [{ productId: "prod_1", quantity: 1 }],
      promoCode: "MINE",
    });
    const merged = mergeCarts(anonymous, user);
    expect(merged.id).toBe("cart_user");
    expect(merged.lines).toEqual([
      { productId: "prod_1", variantId: undefined, quantity: 2 },
      { productId: "prod_9", variantId: undefined, quantity: 2 },
    ]);
    expect(merged.promoCode).toBe("MINE");
  });

  it("falls back to the anonymous promo code", () => {
    const merged = mergeCarts(makeCart({ promoCode: "ANON" }), makeCart({ id: "u" }));
    expect(merged.promoCode).toBe("ANON");
  });
});
