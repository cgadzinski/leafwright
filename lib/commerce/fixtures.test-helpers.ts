import type { Cart, Product, Promo } from "@/lib/db/schema";

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod_1",
    storeId: "store_a",
    slug: "monstera-deliciosa",
    name: "Monstera Deliciosa",
    description: "",
    category: "tropicals",
    price: 3200,
    status: "published",
    inventory: 10,
    images: [],
    variants: [
      { id: "4in", label: '4" pot', priceDelta: 0, inventory: 5 },
      { id: "6in", label: '6" pot', priceDelta: 1200, inventory: 5 },
    ],
    care: { light: "medium", water: "medium", petSafe: false, difficulty: "easy" },
    source: "seed",
    createdAt: "2026-01-01T00:00:00.000Z",
    publishedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makePromo(overrides: Partial<Promo> = {}): Promo {
  return {
    id: "promo_1",
    storeId: "store_a",
    code: "FERN15",
    type: "percent",
    value: 15,
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2027-01-01T00:00:00.000Z",
    isActive: true,
    usageCount: 0,
    ...overrides,
  };
}

export function makeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: "cart_1",
    lines: [],
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}
