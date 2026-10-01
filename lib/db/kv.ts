import { Redis } from "@upstash/redis";
import type { Adapter, PutOptions } from "./adapter";
import { COLLECTIONS, type Collection, type Record as DbRecord } from "./schema";
import { loadSeed } from "./seed-data";

/** The slice of the Redis client the adapter uses, so tests can supply a fake. */
export interface KvClient {
  get<T>(key: string): Promise<T | null>;
  mget<T extends unknown[]>(...keys: string[]): Promise<T>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
}

const PREFIX = "lw";

/**
 * Upstash Redis storage. Seed data is read from the committed JSON and never written to Redis;
 * Redis holds only records created or changed at runtime (which win over the seed) plus the ids
 * of seed records that were removed. Bot records are written with a TTL so they expire.
 */
export class KvAdapter implements Adapter {
  readonly name = "kv" as const;
  private readonly seed = new Map<Collection, Map<string, unknown>>();

  constructor(private readonly client: KvClient) {}

  private seedTable<C extends Collection>(collection: C): Map<string, DbRecord<C>> {
    let table = this.seed.get(collection);
    if (!table) {
      table = new Map(loadSeed(collection).map((record) => [record.id, record]));
      this.seed.set(collection, table);
    }
    return table as Map<string, DbRecord<C>>;
  }

  private key(collection: Collection, id: string): string {
    return `${PREFIX}:${collection}:${id}`;
  }

  private idsKey(collection: Collection): string {
    return `${PREFIX}:${collection}:ids`;
  }

  private removedKey(collection: Collection): string {
    return `${PREFIX}:${collection}:removed`;
  }

  async get<C extends Collection>(collection: C, id: string): Promise<DbRecord<C> | undefined> {
    const stored = await this.client.get<DbRecord<C>>(this.key(collection, id));
    if (stored) return COLLECTIONS[collection].parse(stored) as DbRecord<C>;
    const seeded = this.seedTable(collection).get(id);
    if (!seeded) return undefined;
    const removed = await this.client.smembers(this.removedKey(collection));
    return removed.includes(id) ? undefined : seeded;
  }

  async list<C extends Collection>(collection: C): Promise<DbRecord<C>[]> {
    const [ids, removed] = await Promise.all([
      this.client.smembers(this.idsKey(collection)),
      this.client.smembers(this.removedKey(collection)),
    ]);
    const out = new Map<string, DbRecord<C>>();
    const removedSet = new Set(removed);
    for (const [id, record] of this.seedTable(collection)) {
      if (!removedSet.has(id)) out.set(id, record);
    }
    if (ids.length) {
      const values = await this.client.mget<(DbRecord<C> | null)[]>(
        ...ids.map((id) => this.key(collection, id)),
      );
      const expired: string[] = [];
      ids.forEach((id, index) => {
        const value = values[index];
        if (value) out.set(id, COLLECTIONS[collection].parse(value) as DbRecord<C>);
        else expired.push(id);
      });
      if (expired.length) await this.client.srem(this.idsKey(collection), ...expired);
    }
    return [...out.values()];
  }

  async put<C extends Collection>(
    collection: C,
    record: DbRecord<C>,
    options?: PutOptions,
  ): Promise<void> {
    await this.client.set(
      this.key(collection, record.id),
      record,
      options?.ttlSeconds ? { ex: options.ttlSeconds } : undefined,
    );
    await this.client.sadd(this.idsKey(collection), record.id);
    if (this.seedTable(collection).has(record.id)) {
      await this.client.srem(this.removedKey(collection), record.id);
    }
  }

  async remove(collection: Collection, id: string): Promise<void> {
    await this.client.del(this.key(collection, id));
    await this.client.srem(this.idsKey(collection), id);
    if (this.seedTable(collection).has(id)) {
      await this.client.sadd(this.removedKey(collection), id);
    }
  }
}

export function kvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function createKvAdapter(): KvAdapter {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token)
    throw new Error("KV_REST_API_URL and KV_REST_API_TOKEN are required for the kv adapter");
  return new KvAdapter(new Redis({ url, token }));
}
