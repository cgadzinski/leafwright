import type { Persona } from "@/lib/db/schema";
import { formatMoney } from "@/lib/commerce/cart";
import {
  searchCatalog,
  summarizeStoreSales,
  type ProductSummary,
  type SalesSummary,
  type ToolContext,
} from "./tools";

/** Scripted replies keyed by phrases in the shopper's last message. */
interface ShopperScript {
  match: RegExp;
  search: Parameters<typeof searchCatalog>[0];
  lead: string;
}

const SHOPPER_SCRIPTS: ShopperScript[] = [
  {
    match: /low[- ]light|bedroom|shade|dark|north/i,
    search: { light: "low", plantsOnly: true, limit: 3 },
    lead: "Low light is easier than people think. These three will be happy a few feet from a window:",
  },
  {
    match: /pet|cat|dog|toxic|safe/i,
    search: { petSafe: true, maxPriceCents: 3000, plantsOnly: true, limit: 3 },
    lead: "All of these are pet-safe and under $30:",
  },
  {
    match: /gift|beginner|first plant|easy|forgiving/i,
    search: { difficulty: "easy", plantsOnly: true, limit: 3 },
    lead: "For a first plant you want something that forgives a missed watering. Try one of these:",
  },
  {
    match: /bright|sun|dramatic|statement|big|large|tall/i,
    search: { light: "bright", plantsOnly: true, limit: 3 },
    lead: "With bright light you can go big. These make a statement:",
  },
  {
    match: /succulent|cactus|desert|soil|drain/i,
    search: { category: "succulents", limit: 3 },
    lead: "Succulents want fast-draining soil and a sunny sill. A few favorites:",
  },
  {
    match: /pot|planter|ceramic|terracotta/i,
    search: { category: "planters", limit: 3 },
    lead: "Hand-thrown planters from Kiln & Vine and friends:",
  },
  {
    match: /rare|variegat|collector|unusual/i,
    search: { category: "rare", limit: 3 },
    lead: "Collector plants, propagated in-house by the nurseries:",
  },
];

function formatProducts(products: ProductSummary[]): string {
  return products
    .map(
      (product) =>
        `• ${product.name} (${product.price}, ${product.store})${product.petSafe ? ", pet-safe" : ""} — ${product.url}`,
    )
    .join("\n");
}

export async function scriptedShopperReply(message: string): Promise<string> {
  const script = SHOPPER_SCRIPTS.find((candidate) => candidate.match.test(message));
  if (!script) {
    const picks = await searchCatalog({ difficulty: "easy", plantsOnly: true, limit: 3 });
    return `Happy to help you choose. Tell me how much light you have, whether there are pets around, and roughly how much space. In the meantime, three plants almost everyone gets along with:\n\n${formatProducts(picks)}`;
  }
  let products = await searchCatalog(script.search);
  if (products.length === 0) products = await searchCatalog({ limit: 3 });
  return `${script.lead}\n\n${formatProducts(products)}\n\nWant me to narrow it down by pot size or price?`;
}

function describeChange(percent: number | null, noun: string): string {
  if (percent === null) return `${noun} has no prior period to compare against yet.`;
  if (percent === 0) return `${noun} is flat.`;
  return `${noun} is ${percent > 0 ? "up" : "down"} ${Math.abs(percent)}%`;
}

export function scriptedMerchantReply(message: string, summary: SalesSummary | null): string {
  if (!summary) {
    return "I can only report on a store you're signed in to. Sign in as a nursery owner or staff member and ask again.";
  }
  const top = summary.topProducts
    .map((p) => `${p.name} (${p.units} sold, ${p.revenue})`)
    .join(", ");
  if (/down|drop|slow|why|last week|dip/i.test(message)) {
    return `${describeChange(summary.weekOverWeekPercent, "Week-over-week revenue")}: ${summary.lastWeekRevenue} in the last seven days versus ${summary.weekBeforeRevenue} the week before. Over ${summary.days} days ${summary.store} took ${summary.revenue} across ${summary.orders} orders (${summary.previousRevenue} the period before).\n\nYour best sellers were ${top || "spread evenly"}. ${
      summary.lowStock.length
        ? `Stock is thin on ${summary.lowStock.map((p) => `${p.name} (${p.inventory} left)`).join(", ")}, which usually shows up as a dip a week later.`
        : "Inventory looks healthy, so this is more likely traffic than stock."
    }`;
  }
  if (/restock|inventory|stock|reorder|low/i.test(message)) {
    if (summary.lowStock.length === 0) {
      return `Nothing is critically low right now. Your top sellers over ${summary.days} days were ${top}; keep an eye on those first.`;
    }
    return `Restock these first, they are at or under five units: ${summary.lowStock.map((p) => `${p.name} (${p.inventory} left)`).join(", ")}.\n\nThey matter because your top sellers were ${top || "spread across the catalog"}.`;
  }
  if (/ship|fulfil|fast|deliver|lag|late/i.test(message)) {
    const median = summary.medianFulfillmentHours;
    return `${
      median === null
        ? "No orders have shipped in this window yet."
        : `Median time from order to shipment is ${(median / 24).toFixed(1)} days.`
    } ${summary.slowOrders} order${summary.slowOrders === 1 ? "" : "s"} took longer than three days, and ${summary.openOrders} ${summary.openOrders === 1 ? "is" : "are"} waiting to ship right now.${
      summary.openOrders > 0 ? " Clearing those today is the quickest win." : ""
    }`;
  }
  return `Over the last ${summary.days} days ${summary.store} took ${summary.revenue} across ${summary.orders} orders, ${describeChange(summary.revenueChangePercent, "revenue").toLowerCase()} versus the period before. Top products: ${top || "none yet"}. Ask me why sales moved, what to restock, or how fast you're shipping.`;
}

export async function scriptedReply(
  persona: Persona,
  message: string,
  context: ToolContext,
): Promise<string> {
  if (persona === "shopper") return scriptedShopperReply(message);
  return scriptedMerchantReply(message, await summarizeStoreSales({ days: 30 }, context));
}

/** Emits the reply a few words at a time so the UI streams like the live model. */
export async function* simulateTokenStream(text: string, delayMs = 18): AsyncGenerator<string> {
  const words = text.split(/(\s+)/);
  for (let i = 0; i < words.length; i += 2) {
    const chunk = words[i] + (words[i + 1] ?? "");
    if (!chunk) continue;
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield chunk;
  }
}

export { formatMoney };
