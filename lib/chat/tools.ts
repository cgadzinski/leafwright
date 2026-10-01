import { z } from "zod";
import { medianFulfillmentHours, topProducts } from "@/lib/admin/kpis";
import { CATEGORY_META } from "@/lib/catalog";
import { formatMoney } from "@/lib/commerce/cart";
import { db } from "@/lib/db";
import { CategorySchema, DifficultySchema, LightSchema, type Product } from "@/lib/db/schema";

/** What a tool run has access to beyond its input. */
export interface ToolContext {
  storeId?: string;
}

export const SearchCatalogInput = z.object({
  query: z
    .string()
    .describe("Free text to match against product names and descriptions")
    .optional(),
  category: CategorySchema.optional(),
  light: LightSchema.optional().describe("Light the shopper has available"),
  petSafe: z.boolean().optional().describe("Only pet-safe plants"),
  difficulty: DifficultySchema.optional(),
  maxPriceCents: z.number().int().positive().optional().describe("Upper price bound in cents"),
  plantsOnly: z.boolean().optional().describe("Exclude planters and tools; only living plants"),
  limit: z.number().int().min(1).max(8).default(3),
});

export const GetProductInput = z.object({
  slug: z.string().describe("The product slug from a /products/{slug} link"),
});

export const SummarizeStoreSalesInput = z.object({
  days: z.number().int().min(7).max(90).default(30).describe("Trailing window in days"),
});

export interface ProductSummary {
  slug: string;
  name: string;
  category: string;
  price: string;
  priceCents: number;
  store: string;
  light: Product["care"]["light"];
  water: Product["care"]["water"];
  petSafe: boolean;
  difficulty: Product["care"]["difficulty"];
  url: string;
}

async function summarize(products: Product[]): Promise<ProductSummary[]> {
  const stores = new Map((await db.stores.list()).map((store) => [store.id, store.name]));
  return products.map((product) => ({
    slug: product.slug,
    name: product.name,
    category: CATEGORY_META[product.category].label,
    price: formatMoney(product.price),
    priceCents: product.price,
    store: stores.get(product.storeId) ?? "",
    light: product.care.light,
    water: product.care.water,
    petSafe: product.care.petSafe,
    difficulty: product.care.difficulty,
    url: `/products/${product.slug}`,
  }));
}

export async function searchCatalog(
  input: z.infer<typeof SearchCatalogInput>,
): Promise<ProductSummary[]> {
  const products = (await db.products.list({ q: input.query, category: input.category })).filter(
    (product) =>
      product.inventory > 0 &&
      (!input.plantsOnly || (product.category !== "planters" && product.category !== "tools")) &&
      (!input.light || product.care.light === input.light) &&
      (input.petSafe === undefined || product.care.petSafe === input.petSafe) &&
      (!input.difficulty || product.care.difficulty === input.difficulty) &&
      (!input.maxPriceCents || product.price <= input.maxPriceCents),
  );
  return summarize(products.slice(0, input.limit));
}

export async function getProduct(
  input: z.infer<typeof GetProductInput>,
): Promise<ProductSummary | null> {
  const product = await db.products.getBySlug(input.slug);
  if (!product || product.status !== "published") return null;
  const [summary] = await summarize([product]);
  return { ...summary, description: product.description } as ProductSummary & {
    description: string;
  };
}

export interface SalesSummary {
  store: string;
  days: number;
  revenue: string;
  revenueCents: number;
  orders: number;
  previousRevenue: string;
  previousOrders: number;
  revenueChangePercent: number | null;
  lastWeekRevenue: string;
  weekBeforeRevenue: string;
  weekOverWeekPercent: number | null;
  topProducts: Array<{ name: string; units: number; revenue: string }>;
  lowStock: Array<{ name: string; inventory: number }>;
  medianFulfillmentHours: number | null;
  slowOrders: number;
  openOrders: number;
}

function pct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export async function summarizeStoreSales(
  input: z.infer<typeof SummarizeStoreSalesInput>,
  context: ToolContext,
  now: Date = new Date(),
): Promise<SalesSummary | null> {
  if (!context.storeId) return null;
  const store = await db.stores.getById(context.storeId);
  if (!store) return null;
  const DAY = 864e5;
  const all = await db.orders.list({ storeId: store.id });
  const live = (orders: typeof all) => orders.filter((order) => order.status !== "refunded");
  const within = (from: number, to: number) =>
    live(
      all.filter((order) => {
        const t = new Date(order.placedAt).getTime();
        return t >= from && t < to;
      }),
    );
  const end = now.getTime();
  const current = within(end - input.days * DAY, end);
  const previous = within(end - 2 * input.days * DAY, end - input.days * DAY);
  const lastWeek = within(end - 7 * DAY, end);
  const weekBefore = within(end - 14 * DAY, end - 7 * DAY);
  const sum = (orders: typeof all) => orders.reduce((acc, order) => acc + order.total, 0);
  const products = await db.products.list({ storeId: store.id });
  const slow = current.filter(
    (order) =>
      order.fulfilledAt &&
      new Date(order.fulfilledAt).getTime() - new Date(order.placedAt).getTime() > 3 * DAY,
  ).length;

  return {
    store: store.name,
    days: input.days,
    revenue: formatMoney(sum(current)),
    revenueCents: sum(current),
    orders: current.length,
    previousRevenue: formatMoney(sum(previous)),
    previousOrders: previous.length,
    revenueChangePercent: pct(sum(current), sum(previous)),
    lastWeekRevenue: formatMoney(sum(lastWeek)),
    weekBeforeRevenue: formatMoney(sum(weekBefore)),
    weekOverWeekPercent: pct(sum(lastWeek), sum(weekBefore)),
    topProducts: topProducts(current, 3).map((p) => ({
      name: p.name,
      units: p.units,
      revenue: formatMoney(p.revenue),
    })),
    lowStock: products
      .filter((product) => product.inventory <= 5)
      .sort((a, b) => a.inventory - b.inventory)
      .slice(0, 3)
      .map((product) => ({ name: product.name, inventory: product.inventory })),
    medianFulfillmentHours: medianFulfillmentHours(current),
    slowOrders: slow,
    openOrders: all.filter((order) => order.status === "placed" || order.status === "paid").length,
  };
}

export const TOOL_DESCRIPTIONS = {
  search_catalog:
    "Search the Leafwright catalog of published products. Filter by category, light, pet safety, difficulty, or a maximum price in cents.",
  get_product: "Fetch one product's details by slug.",
  summarize_store_sales:
    "Summarize the merchant's own store: revenue vs the prior period, week over week change, top products, low stock, and fulfillment speed.",
} as const;
