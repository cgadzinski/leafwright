import type { Promo } from "@/lib/db/schema";

export type PromoRejection = "not_found" | "inactive" | "not_started" | "expired";

export type PromoEvaluation =
  { ok: true; promo: Promo } | { ok: false; reason: PromoRejection; promo?: Promo };

/** Decides whether a promo can be applied right now. */
export function evaluatePromo(promo: Promo | undefined, now: Date = new Date()): PromoEvaluation {
  if (!promo) return { ok: false, reason: "not_found" };
  if (!promo.isActive) return { ok: false, reason: "inactive", promo };
  const time = now.getTime();
  if (time < new Date(promo.startsAt).getTime()) return { ok: false, reason: "not_started", promo };
  if (time > new Date(promo.endsAt).getTime()) return { ok: false, reason: "expired", promo };
  return { ok: true, promo };
}

/** Cents taken off a merchandise subtotal. Never exceeds the subtotal. */
export function promoDiscount(promo: Promo, subtotal: number): number {
  if (subtotal <= 0) return 0;
  switch (promo.type) {
    case "percent":
      return Math.min(subtotal, Math.round((subtotal * Math.min(promo.value, 100)) / 100));
    case "fixed":
      return Math.min(subtotal, promo.value);
    case "free_shipping":
      return 0;
  }
}

/** Shipping after a promo is applied. */
export function promoShipping(promo: Promo, shipping: number): number {
  return promo.type === "free_shipping" ? 0 : shipping;
}

export const PROMO_REJECTION_MESSAGES: Record<PromoRejection, string> = {
  not_found: "We couldn't find that code.",
  inactive: "That code is no longer active.",
  not_started: "That code isn't valid yet.",
  expired: "That code has expired.",
};

export function describePromo(promo: Promo): string {
  switch (promo.type) {
    case "percent":
      return `${promo.value}% off`;
    case "fixed":
      return `$${(promo.value / 100).toFixed(2)} off`;
    case "free_shipping":
      return "Free shipping";
  }
}
