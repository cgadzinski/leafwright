/** Traffic bot tuning, mirroring SPEC §12. Percentages are weights that sum to 100. */

export const SHOPPER_SESSIONS = { min: 10, max: 16 } as const;
export const MERCHANT_SESSIONS = { min: 3, max: 5 } as const;

/** Roughly this many shoppers are active on any given day; the pool rotates through all 40 weekly. */
export const ACTIVE_SHOPPERS_PER_DAY = 15;
export const SHOPPER_POOL_SIZE = 40;

export const ENTRY_POINTS = [
  { value: "home", weight: 40 },
  { value: "product", weight: 30 },
  { value: "promo", weight: 15 },
  { value: "store", weight: 15 },
] as const;
export type EntryPoint = (typeof ENTRY_POINTS)[number]["value"];

export const VIEWPORTS = [
  { value: "desktop", weight: 65, size: { width: 1366, height: 860 } },
  { value: "tablet", weight: 20, size: { width: 834, height: 1112 } },
  { value: "mobile", weight: 15, size: { width: 390, height: 844 } },
] as const;
export type ViewportKind = (typeof VIEWPORTS)[number]["value"];

export const SHOPPER_SCENARIOS = [
  { value: "browse", weight: 35 },
  { value: "add-to-cart-and-leave", weight: 20 },
  { value: "abandon-at-payment", weight: 15 },
  { value: "purchase", weight: 20 },
  { value: "chat", weight: 10 },
] as const;
export type ShopperScenario = (typeof SHOPPER_SCENARIOS)[number]["value"];

export const MERCHANT_SCENARIOS = [
  { value: "dashboard-check", weight: 30 },
  { value: "fulfill-orders", weight: 30 },
  { value: "create-and-publish-product", weight: 15 },
  { value: "draft-only", weight: 10 },
  { value: "chat", weight: 15 },
] as const;
export type MerchantScenario = (typeof MERCHANT_SCENARIOS)[number]["value"];

/** Every tenth run one merchant session also does one of these. */
export const TENTH_RUN_EXTRAS = ["export-orders", "edit-promo", "visit-billing"] as const;
export type MerchantExtra = (typeof TENTH_RUN_EXTRAS)[number];

/** Store slugs in rotation order; Fernhollow (pro) appears twice so the flagged analytics page gets traffic. */
export const STORE_ROTATION = [
  "fernhollow-nursery",
  "dry-creek-succulents",
  "fernhollow-nursery",
  "kiln-and-vine",
  "moss-lane",
] as const;

/**
 * Share of shopper sessions that sign in at the start; the rest stay anonymous and, if they buy,
 * check out as guests, which lands purchases at roughly half guest.
 */
export const SIGNED_IN_SHOPPER_SHARE = 0.5;
/** Share of chat sessions that go on to buy something. */
export const CHAT_THEN_PURCHASE_SHARE = 0.5;
/** Share of product-form sessions that abandon before saving. */
export const PRODUCT_FORM_ABANDON_SHARE = 0.2;
/** Share of opened orders a merchant actually fulfills. */
export const FULFILL_SHARE = 0.75;
/** Share of sign-in prompts a shopper bounces from. */
export const SIGN_IN_BOUNCE_SHARE = 0.08;

export const PACING = {
  dwellMs: { min: 1500, max: 6000 },
  typingDelayMs: { min: 55, max: 140 },
  backNavigationShare: 0.15,
} as const;

export const DEFAULT_PASSWORD = "leafwright-demo";
