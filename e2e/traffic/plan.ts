import users from "../../seed/users.json";
import stores from "../../seed/stores.json";
import {
  ACTIVE_SHOPPERS_PER_DAY,
  ENTRY_POINTS,
  MERCHANT_SCENARIOS,
  MERCHANT_SESSIONS,
  SHOPPER_POOL_SIZE,
  SHOPPER_SCENARIOS,
  SHOPPER_SESSIONS,
  SIGNED_IN_SHOPPER_SHARE,
  STORE_ROTATION,
  TENTH_RUN_EXTRAS,
  VIEWPORTS,
  type EntryPoint,
  type MerchantExtra,
  type MerchantScenario,
  type ShopperScenario,
  type ViewportKind,
} from "./config";
import { Rng } from "./rng";

export interface Visitor {
  id: string;
  email: string;
  name: string;
}

export interface MerchantVisitor extends Visitor {
  storeId: string;
  storeSlug: string;
  role: string;
}

export interface ShopperSession {
  kind: "shopper";
  id: string;
  seed: number;
  scenario: ShopperScenario;
  entry: EntryPoint;
  viewport: ViewportKind;
  /** Set when the session signs in; anonymous sessions have no visitor. */
  visitor?: Visitor;
}

export interface MerchantSession {
  kind: "merchant";
  id: string;
  seed: number;
  scenario: MerchantScenario;
  viewport: ViewportKind;
  visitor: MerchantVisitor;
  extra?: MerchantExtra;
}

export type Session = ShopperSession | MerchantSession;

export interface PlanOptions {
  seed: string;
  /** Scales the per-run session ranges. */
  multiplier?: number;
  /** Sequential run number; every tenth run gets a merchant extra. */
  runNumber: number;
  /** The day the run happens on, which drives shopper rotation. */
  date?: Date;
}

const shoppers: Visitor[] = users
  .filter((user) => user.role === "shopper")
  .map((user) => ({ id: user.id, email: user.email, name: user.name }));

const merchants: MerchantVisitor[] = users
  .filter((user) => user.role !== "shopper" && user.storeId)
  .map((user) => {
    const store = stores.find((candidate) => candidate.id === user.storeId);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.storeId!,
      storeSlug: store?.slug ?? "",
    };
  });

const SHOPPERS_PER_DAY_STEP = Math.ceil(SHOPPER_POOL_SIZE / 7);

function dayIndex(date: Date): number {
  return Math.floor(date.getTime() / 864e5);
}

/**
 * The shoppers active on a given day: a sliding window over the pool that advances by six
 * each day, so everyone appears within a week and about fifteen are active on any day.
 */
export function activeShoppers(date: Date, pool: Visitor[] = shoppers): Visitor[] {
  const start = (dayIndex(date) * SHOPPERS_PER_DAY_STEP) % pool.length;
  return Array.from(
    { length: Math.min(ACTIVE_SHOPPERS_PER_DAY, pool.length) },
    (_, i) => pool[(start + i) % pool.length],
  );
}

/** Store assignment for the n-th merchant session of a run; cycles every store with Fernhollow twice. */
export function storeForMerchantSession(runNumber: number, index: number): string {
  return STORE_ROTATION[(runNumber + index) % STORE_ROTATION.length];
}

/** The team member who signs in for a store this run, rotating owner and staff. */
export function merchantForStore(
  storeSlug: string,
  runNumber: number,
  pool: MerchantVisitor[] = merchants,
): MerchantVisitor {
  const team = pool.filter((member) => member.storeSlug === storeSlug);
  if (team.length === 0) throw new Error(`No merchant users for store ${storeSlug}`);
  return team[runNumber % team.length];
}

export function buildPlan({
  seed,
  multiplier = 1,
  runNumber,
  date = new Date(),
}: PlanOptions): Session[] {
  const rng = new Rng(seed);
  const scale = Math.max(0.1, multiplier);
  const shopperCount = Math.max(
    1,
    Math.round(rng.int(SHOPPER_SESSIONS.min, SHOPPER_SESSIONS.max) * scale),
  );
  const merchantCount = Math.max(
    1,
    Math.round(rng.int(MERCHANT_SESSIONS.min, MERCHANT_SESSIONS.max) * scale),
  );
  const todaysShoppers = rng.shuffle(activeShoppers(date));
  const sessions: Session[] = [];

  for (let i = 0; i < shopperCount; i += 1) {
    const signedIn = rng.chance(SIGNED_IN_SHOPPER_SHARE);
    sessions.push({
      kind: "shopper",
      id: `shopper-${String(i + 1).padStart(2, "0")}`,
      seed: rng.int(1, 2 ** 31),
      scenario: rng.weighted(SHOPPER_SCENARIOS).value,
      entry: rng.weighted(ENTRY_POINTS).value,
      viewport: rng.weighted(VIEWPORTS).value,
      visitor: signedIn ? todaysShoppers[i % todaysShoppers.length] : undefined,
    });
  }

  const extraIndex = runNumber % 10 === 0 ? rng.int(0, merchantCount - 1) : -1;
  for (let i = 0; i < merchantCount; i += 1) {
    const storeSlug = storeForMerchantSession(runNumber, i);
    sessions.push({
      kind: "merchant",
      id: `merchant-${String(i + 1).padStart(2, "0")}`,
      seed: rng.int(1, 2 ** 31),
      scenario: rng.weighted(MERCHANT_SCENARIOS).value,
      viewport: rng.weighted(VIEWPORTS).value,
      visitor: merchantForStore(storeSlug, runNumber),
      extra:
        i === extraIndex
          ? TENTH_RUN_EXTRAS[Math.floor(runNumber / 10) % TENTH_RUN_EXTRAS.length]
          : undefined,
    });
  }

  return sessions;
}

export function describeSession(session: Session): string {
  const who =
    session.kind === "merchant"
      ? `${session.visitor.storeSlug} · ${session.visitor.email}`
      : (session.visitor?.email ?? "anonymous");
  const extra = session.kind === "merchant" && session.extra ? ` +${session.extra}` : "";
  const entry = session.kind === "shopper" ? ` via ${session.entry}` : "";
  return `${session.id} ${session.scenario}${extra} (${session.viewport}${entry}) ${who}`;
}
