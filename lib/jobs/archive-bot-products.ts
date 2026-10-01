import { db } from "@/lib/db";
import type { Product } from "@/lib/db/schema";

export const BOT_PRODUCT_MAX_AGE_DAYS = 7;

export function isStaleBotProduct(
  product: Product,
  now: Date,
  maxAgeDays = BOT_PRODUCT_MAX_AGE_DAYS,
): boolean {
  return (
    product.source === "bot" &&
    product.status !== "archived" &&
    new Date(product.createdAt).getTime() <= now.getTime() - maxAgeDays * 864e5
  );
}

/** Archives products the traffic bot created more than a week ago. Returns the archived ids. */
export async function archiveStaleBotProducts(now: Date = new Date()): Promise<string[]> {
  const products = await db.products.list({ status: "all" });
  const stale = products.filter((product) => isStaleBotProduct(product, now));
  for (const product of stale) {
    await db.products.update(product.id, { status: "archived" });
  }
  return stale.map((product) => product.id);
}
