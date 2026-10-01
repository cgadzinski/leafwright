import { describe, expect, it } from "vitest";
import { KvAdapter, type KvClient } from "./kv";

/** In-memory stand-in for Upstash Redis with just enough TTL support to test expiry. */
class FakeRedis implements KvClient {
  store = new Map<string, { value: unknown; expiresAt?: number }>();
  sets = new Map<string, Set<string>>();
  now = 0;

  private live(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== undefined && entry.expiresAt <= this.now) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.live(key) as T | null;
  }
  async mget<T extends unknown[]>(...keys: string[]): Promise<T> {
    return keys.map((key) => this.live(key)) as T;
  }
  async set(key: string, value: unknown, options?: { ex?: number }) {
    this.store.set(key, {
      value,
      expiresAt: options?.ex ? this.now + options.ex * 1000 : undefined,
    });
    return "OK";
  }
  async del(...keys: string[]) {
    let n = 0;
    for (const key of keys) if (this.store.delete(key)) n += 1;
    return n;
  }
  async sadd(key: string, ...members: string[]) {
    const set = this.sets.get(key) ?? new Set<string>();
    members.forEach((member) => set.add(member));
    this.sets.set(key, set);
    return members.length;
  }
  async srem(key: string, ...members: string[]) {
    const set = this.sets.get(key);
    if (!set) return 0;
    members.forEach((member) => set.delete(member));
    return members.length;
  }
  async smembers(key: string) {
    return [...(this.sets.get(key) ?? [])];
  }
}

describe("KvAdapter", () => {
  it("reads the seed without writing it to Redis", async () => {
    const redis = new FakeRedis();
    const adapter = new KvAdapter(redis);
    expect((await adapter.list("stores")).length).toBe(4);
    expect(await adapter.get("stores", "store_fernhollow")).toMatchObject({
      slug: "fernhollow-nursery",
    });
    expect(redis.store.size).toBe(0);
  });

  it("lets runtime writes override seed records and tracks removals", async () => {
    const redis = new FakeRedis();
    const adapter = new KvAdapter(redis);
    const store = (await adapter.get("stores", "store_moss"))!;
    await adapter.put("stores", { ...store, plan: "growth" });
    expect((await adapter.get("stores", "store_moss"))?.plan).toBe("growth");
    expect((await adapter.list("stores")).find((s) => s.id === "store_moss")?.plan).toBe("growth");

    await adapter.remove("stores", "store_moss");
    expect(await adapter.get("stores", "store_moss")).toBeUndefined();
    expect((await adapter.list("stores")).length).toBe(3);

    await adapter.put("stores", store);
    expect((await adapter.list("stores")).length).toBe(4);
  });

  it("adds new records and drops expired bot records from listings", async () => {
    const redis = new FakeRedis();
    const adapter = new KvAdapter(redis);
    const [template] = await adapter.list("orders");
    await adapter.put(
      "orders",
      { ...template, id: "order_bot", number: "LW-99998", source: "bot" },
      { ttlSeconds: 60 },
    );
    await adapter.put("orders", {
      ...template,
      id: "order_app",
      number: "LW-99999",
      source: "app",
    });
    expect((await adapter.list("orders")).length).toBe(162);

    redis.now += 61_000;
    expect(await adapter.get("orders", "order_bot")).toBeUndefined();
    const listed = await adapter.list("orders");
    expect(listed.length).toBe(161);
    expect(listed.some((order) => order.id === "order_app")).toBe(true);
    expect(await redis.smembers("lw:orders:ids")).toEqual(["order_app"]);
  });

  it("validates what it reads back", async () => {
    const redis = new FakeRedis();
    const adapter = new KvAdapter(redis);
    await redis.set("lw:stores:store_bad", { id: "store_bad", nope: true });
    await redis.sadd("lw:stores:ids", "store_bad");
    await expect(adapter.list("stores")).rejects.toThrow();
  });
});
