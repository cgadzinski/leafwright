import { beforeEach, describe, expect, it } from "vitest";
import { db, useAdapter } from "@/lib/db";
import { MemoryAdapter } from "@/lib/db/memory";
import { createScriptedProvider } from "./provider";
import { scriptedMerchantReply, scriptedShopperReply, simulateTokenStream } from "./scripted";
import { searchCatalog, summarizeStoreSales } from "./tools";

async function collect(iterable: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const chunk of iterable) out += chunk;
  return out;
}

describe("catalog tools", () => {
  beforeEach(() => useAdapter(new MemoryAdapter()));

  it("filters by light, pet safety, and price", async () => {
    const results = await searchCatalog({
      light: "low",
      petSafe: true,
      maxPriceCents: 3000,
      limit: 5,
    });
    expect(results.length).toBeGreaterThan(0);
    for (const product of results) {
      expect(product.light).toBe("low");
      expect(product.petSafe).toBe(true);
      expect(product.priceCents).toBeLessThanOrEqual(3000);
      expect(product.url).toMatch(/^\/products\//);
    }
  });

  it("summarizes a store's sales and refuses without a store", async () => {
    const fern = await db.stores.getBySlug("fernhollow-nursery");
    const summary = await summarizeStoreSales(
      { days: 30 },
      { storeId: fern!.id },
      new Date("2026-10-01T12:00:00Z"),
    );
    expect(summary?.store).toBe("Fernhollow Nursery");
    expect(summary?.orders).toBeGreaterThan(0);
    expect(summary?.topProducts.length).toBeGreaterThan(0);
    expect(await summarizeStoreSales({ days: 30 }, {})).toBeNull();
  });
});

describe("scripted replies", () => {
  beforeEach(() => useAdapter(new MemoryAdapter()));

  it("answers the shopper suggestions with real products", async () => {
    const lowLight = await scriptedShopperReply("Low-light plant for a bedroom");
    expect(lowLight).toContain("/products/");
    const petSafe = await scriptedShopperReply("Pet-safe under $30");
    expect(petSafe).toContain("pet-safe");
    const fallback = await scriptedShopperReply("hello there");
    expect(fallback).toContain("how much light");
  });

  it("answers the merchant suggestions from the sales summary", async () => {
    const fern = await db.stores.getBySlug("fernhollow-nursery");
    const summary = await summarizeStoreSales(
      { days: 30 },
      { storeId: fern!.id },
      new Date("2026-10-01T12:00:00Z"),
    );
    expect(scriptedMerchantReply("Why were sales down last week?", summary)).toMatch(
      /Week-over-week revenue/,
    );
    expect(scriptedMerchantReply("What should I restock?", summary)).toMatch(
      /Restock|Nothing is critically low/,
    );
    expect(scriptedMerchantReply("How fast am I shipping?", summary)).toMatch(
      /Median time|No orders have shipped/,
    );
    expect(scriptedMerchantReply("anything", null)).toMatch(/signed in/);
  });

  it("streams the reply in chunks that reassemble exactly", async () => {
    const text = "Three plants almost everyone gets along with.";
    expect(await collect(simulateTokenStream(text, 0))).toBe(text);
    const provider = createScriptedProvider(0);
    const reply = await collect(
      provider.stream({
        persona: "shopper",
        messages: [{ role: "user", content: "Gift for a beginner" }],
        context: {},
      }),
    );
    expect(reply).toContain("first plant");
  });
});
