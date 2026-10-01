import { beforeEach, describe, expect, it } from "vitest";
import { MemoryAdapter } from "./memory";
import { db, useAdapter } from "./index";

describe("repository over the memory adapter", () => {
  beforeEach(() => {
    useAdapter(new MemoryAdapter());
  });

  it("loads the committed seed at the spec counts", async () => {
    expect((await db.stores.list()).length).toBe(4);
    expect((await db.users.list()).length).toBe(52);
    expect((await db.products.list({ status: "all" })).length).toBe(60);
    expect((await db.orders.list()).length).toBe(160);
    expect((await db.promos.list()).length).toBe(8);
  });

  it("lists only published products by default and filters by category and store", async () => {
    const published = await db.products.list();
    expect(published.every((product) => product.status === "published")).toBe(true);
    const fern = await db.stores.getBySlug("fernhollow-nursery");
    const fernRare = await db.products.list({ storeId: fern!.id, category: "rare" });
    expect(fernRare.every((p) => p.storeId === fern!.id && p.category === "rare")).toBe(true);
  });

  it("issues the next order number after the seed", async () => {
    expect(await db.orders.nextNumber()).toBe("LW-10161");
  });

  it("finds promos by code case-insensitively", async () => {
    const promo = await db.promos.getByCode("fern15");
    expect(promo?.code).toBe("FERN15");
  });

  it("validates writes and keeps them for later reads", async () => {
    const store = (await db.stores.list())[0];
    await db.stores.update(store.id, { name: "Renamed" });
    expect((await db.stores.getById(store.id))?.name).toBe("Renamed");
    await expect(
      db.stores.update(store.id, { plan: "enterprise" as unknown as "pro" }),
    ).rejects.toThrow();
  });

  it("expires bot records after their ttl", async () => {
    const adapter = new MemoryAdapter();
    useAdapter(adapter);
    const [template] = await db.orders.list();
    const bot = { ...template, id: "order_bot", number: "LW-99999", source: "bot" as const };
    await db.orders.create(bot);
    expect(await db.orders.getById("order_bot")).toBeDefined();
    const originalNow = Date.now;
    Date.now = () => originalNow() + 15 * 24 * 60 * 60 * 1000;
    try {
      expect(await db.orders.getById("order_bot")).toBeUndefined();
    } finally {
      Date.now = originalNow;
    }
  });
});
