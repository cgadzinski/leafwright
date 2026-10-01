import { beforeEach, describe, expect, it } from "vitest";
import { db, useAdapter } from "@/lib/db";
import { MemoryAdapter } from "@/lib/db/memory";
import {
  canRequestRefund,
  hasRefundRequest,
  ordersForUser,
  REFUND_REQUEST_PREFIX,
} from "./history";

describe("order history", () => {
  beforeEach(() => useAdapter(new MemoryAdapter()));

  it("includes guest orders placed under the user's email, newest first, without duplicates", async () => {
    const [guestOrder] = (await db.orders.list()).filter((order) => order.guestEmail);
    const user = { id: "user_0040", email: guestOrder.guestEmail! };
    const own = await db.orders.list({ customerId: user.id });
    const orders = await ordersForUser(user);
    expect(orders.map((o) => o.id)).toContain(guestOrder.id);
    expect(orders.length).toBe(own.length + 1);
    expect(new Set(orders.map((o) => o.id)).size).toBe(orders.length);
    for (let i = 1; i < orders.length; i += 1) {
      expect(orders[i - 1].placedAt >= orders[i].placedAt).toBe(true);
    }
  });

  it("tracks refund requests through notes", async () => {
    const [order] = await db.orders.list({ status: "delivered" });
    expect(hasRefundRequest(order)).toBe(false);
    expect(canRequestRefund(order)).toBe(true);
    const requested = {
      ...order,
      notes: [
        ...order.notes,
        {
          id: "note_x",
          authorId: "u",
          body: `${REFUND_REQUEST_PREFIX}: arrived damaged`,
          createdAt: order.placedAt,
        },
      ],
    };
    expect(hasRefundRequest(requested)).toBe(true);
    expect(canRequestRefund(requested)).toBe(false);
    expect(canRequestRefund({ ...order, status: "refunded" })).toBe(false);
  });
});
