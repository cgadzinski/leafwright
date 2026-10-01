import { describe, expect, it } from "vitest";
import type { Order, User } from "@/lib/db/schema";
import {
  emailFromGuestId,
  guestCustomerId,
  ordersForCustomer,
  summarizeCustomers,
} from "./customers";

const base: Order = {
  id: "o1",
  number: "LW-10001",
  storeId: "s",
  lines: [{ productId: "p", slug: "p", name: "P", unitPrice: 100, quantity: 1 }],
  subtotal: 100,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 100,
  status: "paid",
  shippingAddress: {
    name: "Guest Gal",
    line1: "1",
    city: "C",
    region: "R",
    postalCode: "0",
    country: "US",
  },
  shippingMethod: "standard",
  notes: [],
  source: "seed",
  placedAt: "2026-09-01T00:00:00.000Z",
};

const user: User = {
  id: "u1",
  email: "ann@example.com",
  name: "Ann",
  role: "shopper",
  passwordHash: "x",
  followedStoreIds: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  lastSignInAt: "2026-01-01T00:00:00.000Z",
};

describe("customer summaries", () => {
  it("groups by user and by guest email, newest activity first", () => {
    const orders: Order[] = [
      { ...base, id: "a", customerId: "u1", total: 500 },
      {
        ...base,
        id: "b",
        customerId: "u1",
        total: 700,
        placedAt: "2026-09-20T00:00:00.000Z",
        status: "refunded",
      },
      { ...base, id: "c", guestEmail: "Guest@Example.com", placedAt: "2026-09-25T00:00:00.000Z" },
      { ...base, id: "d", guestEmail: "guest@example.com", placedAt: "2026-08-01T00:00:00.000Z" },
    ];
    const summaries = summarizeCustomers(orders, [user]);
    expect(summaries.map((s) => s.id)).toEqual([guestCustomerId("guest@example.com"), "u1"]);
    expect(summaries[1]).toMatchObject({ name: "Ann", orderCount: 2, totalSpent: 500 });
    expect(summaries[0]).toMatchObject({ isGuest: true, orderCount: 2, name: "Guest Gal" });
    expect(ordersForCustomer(orders, summaries[0].id).map((o) => o.id)).toEqual(["c", "d"]);
    expect(ordersForCustomer(orders, "u1").length).toBe(2);
  });

  it("round-trips guest ids", () => {
    expect(emailFromGuestId(guestCustomerId("x@y.io"))).toBe("x@y.io");
    expect(emailFromGuestId("u1")).toBeNull();
  });
});
