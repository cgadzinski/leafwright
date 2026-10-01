import { db } from "@/lib/db";
import type { Order, User } from "@/lib/db/schema";

/** A shopper's orders: those placed while signed in plus guest orders under the same email. */
export async function ordersForUser(user: Pick<User, "id" | "email">): Promise<Order[]> {
  const [own, guest] = await Promise.all([
    db.orders.list({ customerId: user.id }),
    db.orders.list({ guestEmail: user.email }),
  ]);
  const seen = new Set<string>();
  return [...own, ...guest]
    .filter((order) => (seen.has(order.id) ? false : (seen.add(order.id), true)))
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

export function orderBelongsTo(order: Order, user: Pick<User, "id" | "email">): boolean {
  return (
    order.customerId === user.id || order.guestEmail?.toLowerCase() === user.email.toLowerCase()
  );
}

export const ORDER_STATUS_LABELS: Record<Order["status"], string> = {
  placed: "Placed",
  paid: "Paid",
  fulfilled: "Shipped",
  delivered: "Delivered",
  refunded: "Refunded",
};

/** A customer-visible refund request is recorded as a note until the merchant acts on it. */
export const REFUND_REQUEST_PREFIX = "Refund requested by customer";

export function hasRefundRequest(order: Order): boolean {
  return order.notes.some((note) => note.body.startsWith(REFUND_REQUEST_PREFIX));
}

export function canRequestRefund(order: Order): boolean {
  return order.status !== "refunded" && !hasRefundRequest(order);
}
