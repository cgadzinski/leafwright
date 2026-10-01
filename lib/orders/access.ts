import { cookies } from "next/headers";
import { z } from "zod";
import type { Session } from "next-auth";
import { cookieOptions, decodeSigned, encodeSigned } from "@/lib/cookies";
import type { Order } from "@/lib/db/schema";

/** Guests can see the confirmation for orders they placed in this browser. */
export const RECENT_ORDERS_COOKIE = "lw_orders";
const RecentOrdersSchema = z.array(z.string()).max(20);

export async function rememberGuestOrders(numbers: string[]): Promise<void> {
  const jar = await cookies();
  const existing = decodeSigned(jar.get(RECENT_ORDERS_COOKIE)?.value, RecentOrdersSchema) ?? [];
  const next = [...new Set([...numbers, ...existing])].slice(0, 20);
  jar.set(RECENT_ORDERS_COOKIE, encodeSigned(next), cookieOptions);
}

export async function canViewOrder(order: Order, session: Session | null): Promise<boolean> {
  if (session?.user && order.customerId === session.user.id) return true;
  if (session?.user && session.store && order.storeId === session.store.id) return true;
  const jar = await cookies();
  const recent = decodeSigned(jar.get(RECENT_ORDERS_COOKIE)?.value, RecentOrdersSchema) ?? [];
  return recent.includes(order.number);
}
