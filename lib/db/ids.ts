import { randomUUID } from "node:crypto";

export type IdPrefix =
  | "store"
  | "user"
  | "addr"
  | "prod"
  | "var"
  | "cart"
  | "order"
  | "note"
  | "promo"
  | "conv"
  | "msg"
  | "invite";

export function newId(prefix: IdPrefix): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
