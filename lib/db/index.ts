import { nextOrderNumber } from "@/lib/commerce/order-number";
import type { Adapter, PutOptions } from "./adapter";
import { createMemoryAdapter } from "./memory";
import {
  COLLECTIONS,
  type Address,
  type Cart,
  type Category,
  type Collection,
  type Conversation,
  type Invite,
  type Order,
  type OrderStatus,
  type Product,
  type ProductStatus,
  type Promo,
  type Record as DbRecord,
  type Store,
  type User,
} from "./schema";

export * from "./schema";

/** Bot-created records are kept for two weeks. */
export const BOT_RECORD_TTL_SECONDS = 14 * 24 * 60 * 60;

let adapter: Adapter | undefined;

function getAdapter(): Adapter {
  if (!adapter) adapter = createMemoryAdapter();
  return adapter;
}

/** Swaps the storage adapter. Used by the KV wiring and by tests. */
export function useAdapter(next: Adapter | undefined): void {
  adapter = next;
}

async function write<C extends Collection>(
  collection: C,
  record: DbRecord<C>,
): Promise<DbRecord<C>> {
  const parsed = COLLECTIONS[collection].parse(record) as DbRecord<C>;
  const options: PutOptions =
    "source" in parsed && parsed.source === "bot" ? { ttlSeconds: BOT_RECORD_TTL_SECONDS } : {};
  await getAdapter().put(collection, parsed, options);
  return parsed;
}

async function patch<C extends Collection>(
  collection: C,
  id: string,
  changes: Partial<DbRecord<C>>,
): Promise<DbRecord<C>> {
  const current = await getAdapter().get(collection, id);
  if (!current) throw new NotFoundError(collection, id);
  return write(collection, { ...current, ...changes, id });
}

export class NotFoundError extends Error {
  constructor(
    readonly collection: Collection,
    readonly id: string,
  ) {
    super(`${collection}/${id} not found`);
    this.name = "NotFoundError";
  }
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc";

export interface ProductQuery {
  storeId?: string;
  status?: ProductStatus | "all";
  category?: Category;
  q?: string;
  sort?: ProductSort;
}

export interface OrderQuery {
  storeId?: string;
  customerId?: string;
  guestEmail?: string;
  status?: OrderStatus;
  from?: Date;
  to?: Date;
}

export const db = {
  adapterName: () => getAdapter().name,

  stores: {
    list: async (): Promise<Store[]> =>
      (await getAdapter().list("stores")).sort((a, b) => a.name.localeCompare(b.name)),
    getById: (id: string) => getAdapter().get("stores", id),
    getBySlug: async (slug: string) =>
      (await getAdapter().list("stores")).find((store) => store.slug === slug),
    update: (id: string, changes: Partial<Store>) => patch("stores", id, changes),
  },

  users: {
    list: () => getAdapter().list("users"),
    getById: (id: string) => getAdapter().get("users", id),
    getByEmail: async (email: string) => {
      const needle = email.trim().toLowerCase();
      return (await getAdapter().list("users")).find((user) => user.email.toLowerCase() === needle);
    },
    listByStore: async (storeId: string) =>
      (await getAdapter().list("users")).filter((user) => user.storeId === storeId),
    create: (user: User) => write("users", user),
    update: (id: string, changes: Partial<User>) => patch("users", id, changes),
  },

  addresses: {
    listByUser: async (userId: string) =>
      (await getAdapter().list("addresses")).filter((address) => address.userId === userId),
    getById: (id: string) => getAdapter().get("addresses", id),
    create: (address: Address) => write("addresses", address),
    update: (id: string, changes: Partial<Address>) => patch("addresses", id, changes),
    remove: (id: string) => getAdapter().remove("addresses", id),
  },

  products: {
    list: async (query: ProductQuery = {}): Promise<Product[]> => {
      const { storeId, status = "published", category, q, sort = "featured" } = query;
      const needle = q?.trim().toLowerCase();
      let products = (await getAdapter().list("products")).filter(
        (product) =>
          (status === "all" || product.status === status) &&
          (!storeId || product.storeId === storeId) &&
          (!category || product.category === category) &&
          (!needle ||
            product.name.toLowerCase().includes(needle) ||
            product.description.toLowerCase().includes(needle) ||
            product.category.includes(needle)),
      );
      switch (sort) {
        case "newest":
          products = products.sort(byNewest);
          break;
        case "price-asc":
          products = products.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          products = products.sort((a, b) => b.price - a.price);
          break;
        case "featured":
          products = products.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
      return products;
    },
    getById: (id: string) => getAdapter().get("products", id),
    getBySlug: async (slug: string) =>
      (await getAdapter().list("products")).find((product) => product.slug === slug),
    getMany: async (ids: string[]): Promise<Product[]> => {
      const wanted = new Set(ids);
      return (await getAdapter().list("products")).filter((product) => wanted.has(product.id));
    },
    create: (product: Product) => write("products", product),
    update: (id: string, changes: Partial<Product>) => patch("products", id, changes),
  },

  carts: {
    getById: (id: string) => getAdapter().get("carts", id),
    getByUserId: async (userId: string) =>
      (await getAdapter().list("carts")).find((cart) => cart.userId === userId),
    save: (cart: Cart) => write("carts", cart),
    remove: (id: string) => getAdapter().remove("carts", id),
  },

  orders: {
    list: async (query: OrderQuery = {}): Promise<Order[]> => {
      const { storeId, customerId, guestEmail, status, from, to } = query;
      return (await getAdapter().list("orders"))
        .filter(
          (order) =>
            (!storeId || order.storeId === storeId) &&
            (!customerId || order.customerId === customerId) &&
            (!guestEmail || order.guestEmail?.toLowerCase() === guestEmail.toLowerCase()) &&
            (!status || order.status === status) &&
            (!from || new Date(order.placedAt) >= from) &&
            (!to || new Date(order.placedAt) <= to),
        )
        .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
    },
    getById: (id: string) => getAdapter().get("orders", id),
    getByNumber: async (orderNumber: string) => {
      const needle = orderNumber.trim().toUpperCase();
      return (await getAdapter().list("orders")).find((order) => order.number === needle);
    },
    nextNumber: async () =>
      nextOrderNumber((await getAdapter().list("orders")).map((order) => order.number)),
    create: (order: Order) => write("orders", order),
    update: (id: string, changes: Partial<Order>) => patch("orders", id, changes),
  },

  promos: {
    list: async (storeId?: string): Promise<Promo[]> =>
      (await getAdapter().list("promos"))
        .filter((promo) => !storeId || promo.storeId === storeId)
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    getById: (id: string) => getAdapter().get("promos", id),
    getByCode: async (code: string) => {
      const needle = code.trim().toUpperCase();
      return (await getAdapter().list("promos")).find((promo) => promo.code === needle);
    },
    create: (promo: Promo) => write("promos", promo),
    update: (id: string, changes: Partial<Promo>) => patch("promos", id, changes),
  },

  conversations: {
    getById: (id: string) => getAdapter().get("conversations", id),
    list: async (storeId?: string): Promise<Conversation[]> =>
      (await getAdapter().list("conversations"))
        .filter((conversation) => !storeId || conversation.storeId === storeId)
        .sort(byNewest),
    save: (conversation: Conversation) => write("conversations", conversation),
  },

  invites: {
    listByStore: async (storeId: string): Promise<Invite[]> =>
      (await getAdapter().list("invites"))
        .filter((invite) => invite.storeId === storeId)
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    create: (invite: Invite) => write("invites", invite),
  },
};

export type Db = typeof db;
