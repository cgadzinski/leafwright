import stores from "@/seed/stores.json";
import users from "@/seed/users.json";
import addresses from "@/seed/addresses.json";
import products from "@/seed/products.json";
import orders from "@/seed/orders.json";
import promos from "@/seed/promos.json";
import conversations from "@/seed/conversations.json";
import { COLLECTIONS, type Collection, type Record as DbRecord } from "./schema";

const RAW: Record<Collection, unknown[]> = {
  stores,
  users,
  addresses,
  products,
  carts: [],
  orders,
  promos,
  conversations,
  invites: [],
};

/** Parses the committed seed files through their schemas. */
export function loadSeed<C extends Collection>(collection: C): DbRecord<C>[] {
  const schema = COLLECTIONS[collection];
  return RAW[collection].map((row) => schema.parse(row) as DbRecord<C>);
}
