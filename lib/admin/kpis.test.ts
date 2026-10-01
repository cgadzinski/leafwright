import { describe, expect, it } from "vitest";
import type { Cart, Order, Product } from "@/lib/db/schema";
import { computeStoreKpis, dailyRevenue, medianFulfillmentHours, topProducts } from "./kpis";

const now = new Date("2026-10-01T12:00:00.000Z");
const day = (n: number) => new Date(now.getTime() - n * 864e5).toISOString();

function order(overrides: Partial<Order>): Order {
  return {
    id: overrides.id ?? "o",
    number: "LW-10001",
    storeId: "store_a",
    lines: [{ productId: "p1", slug: "p1", name: "Plant", unitPrice: 1000, quantity: 1 }],
    subtotal: 1000,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 1000,
    status: "paid",
    shippingAddress: {
      name: "A",
      line1: "1",
      city: "C",
      region: "R",
      postalCode: "0",
      country: "US",
    },
    shippingMethod: "standard",
    notes: [],
    source: "seed",
    placedAt: day(1),
    ...overrides,
  };
}

const products: Product[] = [
  {
    id: "p1",
    storeId: "store_a",
    slug: "p1",
    name: "Plant",
    description: "",
    category: "tropicals",
    price: 1000,
    status: "published",
    inventory: 1,
    images: [],
    variants: [],
    care: { light: "low", water: "low", petSafe: true, difficulty: "easy" },
    source: "seed",
    createdAt: day(100),
  },
];

describe("computeStoreKpis", () => {
  it("compares the trailing window against the one before it and skips refunds", () => {
    const orders = [
      order({ id: "a", total: 3000, placedAt: day(2) }),
      order({ id: "b", total: 1000, placedAt: day(10) }),
      order({ id: "c", total: 9999, placedAt: day(5), status: "refunded" }),
      order({ id: "d", total: 2000, placedAt: day(40) }),
    ];
    const kpis = computeStoreKpis(orders, [], products, now);
    expect(kpis.revenue).toEqual({ value: 4000, previous: 2000, change: 1 });
    expect(kpis.orders).toEqual({ value: 2, previous: 1, change: 1 });
    expect(kpis.aov.value).toBe(2000);
    expect(kpis.conversion.value).toBe(1);
  });

  it("counts open carts holding this store's products against conversion", () => {
    const carts: Cart[] = [
      { id: "c1", lines: [{ productId: "p1", quantity: 1 }], updatedAt: day(1) },
      { id: "c2", lines: [{ productId: "other", quantity: 1 }], updatedAt: day(1) },
      { id: "c3", lines: [{ productId: "p1", quantity: 1 }], updatedAt: day(60) },
    ];
    const kpis = computeStoreKpis([order({ id: "a" })], carts, products, now);
    expect(kpis.conversion.value).toBe(0.5);
  });

  it("reports no baseline change when the previous window is empty", () => {
    const kpis = computeStoreKpis([order({ id: "a" })], [], products, now);
    expect(kpis.revenue.change).toBeNull();
    expect(computeStoreKpis([], [], products, now).revenue.change).toBe(0);
  });
});

describe("dailyRevenue", () => {
  it("fills every day of the window oldest first", () => {
    const series = dailyRevenue(
      [order({ id: "a", total: 500 }), order({ id: "b", placedAt: day(1), total: 250 })],
      now,
      3,
    );
    expect(series.map((d) => d.date)).toEqual([
      day(2).slice(0, 10),
      day(1).slice(0, 10),
      day(0).slice(0, 10),
    ]);
    expect(series[1]).toMatchObject({ revenue: 750, orders: 2 });
  });
});

describe("topProducts and fulfillment", () => {
  it("ranks products by revenue", () => {
    const orders = [
      order({
        id: "a",
        lines: [{ productId: "p1", slug: "p1", name: "Plant", unitPrice: 1000, quantity: 3 }],
      }),
      order({
        id: "b",
        lines: [{ productId: "p2", slug: "p2", name: "Pot", unitPrice: 5000, quantity: 1 }],
      }),
    ];
    expect(topProducts(orders).map((p) => p.name)).toEqual(["Pot", "Plant"]);
  });

  it("computes the median fulfillment time", () => {
    const orders = [
      order({ id: "a", placedAt: day(3), fulfilledAt: day(2) }),
      order({ id: "b", placedAt: day(3), fulfilledAt: day(1) }),
      order({ id: "c", placedAt: day(3) }),
    ];
    expect(medianFulfillmentHours(orders)).toBe(36);
    expect(medianFulfillmentHours([order({ id: "c" })])).toBeNull();
  });
});
