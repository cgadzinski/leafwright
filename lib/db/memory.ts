import type { Adapter, PutOptions } from "./adapter";
import { COLLECTIONS, type Collection, type Record as DbRecord } from "./schema";
import { loadSeed } from "./seed-data";

interface Entry {
  record: unknown;
  expiresAt?: number;
}

type Tables = { [C in Collection]: Map<string, Entry> };

function buildTables(): Tables {
  const tables = {} as Tables;
  for (const collection of Object.keys(COLLECTIONS) as Collection[]) {
    const table = new Map<string, Entry>();
    for (const record of loadSeed(collection)) table.set(record.id, { record });
    tables[collection] = table;
  }
  return tables;
}

/**
 * In-process storage seeded from `seed/*.json`. Mutations last for the life of the
 * process. The tables hang off `globalThis` so hot reloads in development keep them.
 */
export class MemoryAdapter implements Adapter {
  readonly name = "memory" as const;
  private readonly tables: Tables;

  constructor(tables: Tables = buildTables()) {
    this.tables = tables;
  }

  async get<C extends Collection>(collection: C, id: string): Promise<DbRecord<C> | undefined> {
    const entry = this.tables[collection].get(id);
    if (!entry) return undefined;
    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      this.tables[collection].delete(id);
      return undefined;
    }
    return entry.record as DbRecord<C>;
  }

  async list<C extends Collection>(collection: C): Promise<DbRecord<C>[]> {
    const now = Date.now();
    const table = this.tables[collection];
    const out: DbRecord<C>[] = [];
    for (const [id, entry] of table) {
      if (entry.expiresAt !== undefined && entry.expiresAt <= now) {
        table.delete(id);
        continue;
      }
      out.push(entry.record as DbRecord<C>);
    }
    return out;
  }

  async put<C extends Collection>(
    collection: C,
    record: DbRecord<C>,
    options?: PutOptions,
  ): Promise<void> {
    this.tables[collection].set(record.id, {
      record,
      expiresAt: options?.ttlSeconds ? Date.now() + options.ttlSeconds * 1000 : undefined,
    });
  }

  async remove(collection: Collection, id: string): Promise<void> {
    this.tables[collection].delete(id);
  }
}

const globalStore = globalThis as typeof globalThis & { __leafwrightMemoryTables?: Tables };

export function createMemoryAdapter(): MemoryAdapter {
  if (!globalStore.__leafwrightMemoryTables) {
    globalStore.__leafwrightMemoryTables = buildTables();
  }
  return new MemoryAdapter(globalStore.__leafwrightMemoryTables);
}
