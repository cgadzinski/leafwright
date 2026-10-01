import { beforeEach, describe, expect, it } from "vitest";
import { db, useAdapter } from "@/lib/db";
import { MemoryAdapter } from "@/lib/db/memory";
import { archiveStaleBotProducts, isStaleBotProduct } from "./archive-bot-products";

describe("archive stale bot products", () => {
  beforeEach(() => useAdapter(new MemoryAdapter()));

  it("archives only bot products older than seven days", async () => {
    const [template] = await db.products.list();
    const now = new Date("2026-10-01T12:00:00Z");
    const old = {
      ...template,
      id: "prod_bot_old",
      slug: "bot-old",
      source: "bot" as const,
      createdAt: "2026-09-20T00:00:00.000Z",
    };
    const fresh = {
      ...template,
      id: "prod_bot_new",
      slug: "bot-new",
      source: "bot" as const,
      createdAt: "2026-09-30T00:00:00.000Z",
    };
    const human = {
      ...template,
      id: "prod_app_old",
      slug: "app-old",
      source: "app" as const,
      createdAt: "2026-09-01T00:00:00.000Z",
    };
    for (const product of [old, fresh, human]) await db.products.create(product);

    expect(isStaleBotProduct(old, now)).toBe(true);
    expect(isStaleBotProduct(fresh, now)).toBe(false);
    expect(isStaleBotProduct(human, now)).toBe(false);

    const archived = await archiveStaleBotProducts(now);
    expect(archived).toEqual(["prod_bot_old"]);
    expect((await db.products.getById("prod_bot_old"))?.status).toBe("archived");
    expect((await db.products.getById("prod_bot_new"))?.status).toBe("published");
    expect(await archiveStaleBotProducts(now)).toEqual([]);
  });
});
