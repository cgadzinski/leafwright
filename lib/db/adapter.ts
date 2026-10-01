import type { Collection, Record as DbRecord } from "./schema";

export interface PutOptions {
  /** Seconds until the record disappears. Omit for records that should last. */
  ttlSeconds?: number;
}

/** The storage contract both the memory and KV adapters satisfy. */
export interface Adapter {
  readonly name: "memory" | "kv";
  get<C extends Collection>(collection: C, id: string): Promise<DbRecord<C> | undefined>;
  list<C extends Collection>(collection: C): Promise<DbRecord<C>[]>;
  put<C extends Collection>(
    collection: C,
    record: DbRecord<C>,
    options?: PutOptions,
  ): Promise<void>;
  remove(collection: Collection, id: string): Promise<void>;
}
