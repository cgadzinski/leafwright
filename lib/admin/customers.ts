import type { Order, User } from "@/lib/db/schema";

export interface CustomerSummary {
  /** A user id, or `guest-<base64url email>` for guest buyers. */
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  orderCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
}

export function guestCustomerId(email: string): string {
  return `guest-${Buffer.from(email.toLowerCase()).toString("base64url")}`;
}

export function emailFromGuestId(id: string): string | null {
  if (!id.startsWith("guest-")) return null;
  try {
    return Buffer.from(id.slice("guest-".length), "base64url").toString();
  } catch {
    return null;
  }
}

/** Joins a store's orders to shopper users, treating each guest email as its own customer. */
export function summarizeCustomers(orders: Order[], users: User[]): CustomerSummary[] {
  const byUser = new Map(users.map((user) => [user.id, user]));
  const summaries = new Map<string, CustomerSummary>();

  for (const order of orders) {
    const user = order.customerId ? byUser.get(order.customerId) : undefined;
    const email = user?.email ?? order.guestEmail;
    if (!email) continue;
    const id = user ? user.id : guestCustomerId(email);
    const entry = summaries.get(id) ?? {
      id,
      name: user?.name ?? order.shippingAddress.name,
      email,
      isGuest: !user,
      orderCount: 0,
      totalSpent: 0,
      firstOrderAt: order.placedAt,
      lastOrderAt: order.placedAt,
    };
    entry.orderCount += 1;
    if (order.status !== "refunded") entry.totalSpent += order.total;
    if (order.placedAt < entry.firstOrderAt) entry.firstOrderAt = order.placedAt;
    if (order.placedAt > entry.lastOrderAt) entry.lastOrderAt = order.placedAt;
    summaries.set(id, entry);
  }

  return [...summaries.values()].sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt));
}

export function ordersForCustomer(orders: Order[], customerId: string): Order[] {
  const guestEmail = emailFromGuestId(customerId);
  return orders.filter((order) =>
    guestEmail
      ? order.guestEmail?.toLowerCase() === guestEmail.toLowerCase()
      : order.customerId === customerId,
  );
}
