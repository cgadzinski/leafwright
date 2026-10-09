import { describe, expect, it } from "vitest";
import {
  CONVERSATION_SESSIONS,
  ENTRY_POINTS,
  MERCHANT_SESSIONS,
  SHOPPER_SESSIONS,
  SHOPPER_SCENARIOS,
  VIEWPORTS,
} from "./config";
import { intentsFor } from "./conversations";
import {
  activeShoppers,
  buildConversationPlan,
  buildPlan,
  merchantForStore,
  storeForMerchantSession,
} from "./plan";
import { Rng } from "./rng";

describe("rng", () => {
  it("is deterministic for a seed and respects weights roughly", () => {
    const a = new Rng("run-1");
    const b = new Rng("run-1");
    expect([a.next(), a.next(), a.int(1, 6)]).toEqual([b.next(), b.next(), b.int(1, 6)]);
    const rng = new Rng(42);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 10_000; i += 1) {
      const pick = rng.weighted(ENTRY_POINTS).value;
      counts[pick] = (counts[pick] ?? 0) + 1;
    }
    expect(counts.home / 10_000).toBeGreaterThan(0.36);
    expect(counts.home / 10_000).toBeLessThan(0.44);
    expect(counts.promo / 10_000).toBeGreaterThan(0.12);
    expect(counts.promo / 10_000).toBeLessThan(0.18);
  });
});

describe("visitor rotation", () => {
  it("activates about fifteen shoppers a day and covers the whole pool within a week", () => {
    const day = new Date("2026-10-05T12:00:00Z");
    const today = activeShoppers(day);
    expect(today).toHaveLength(15);
    const seen = new Set<string>();
    for (let offset = 0; offset < 7; offset += 1) {
      for (const shopper of activeShoppers(new Date(day.getTime() + offset * 864e5)))
        seen.add(shopper.id);
    }
    expect(seen.size).toBe(40);
  });

  it("cycles merchant sessions through every store with Fernhollow weighted up", () => {
    const slugs = Array.from({ length: 5 }, (_, i) => storeForMerchantSession(7, i));
    expect(new Set(slugs)).toEqual(
      new Set(["fernhollow-nursery", "dry-creek-succulents", "kiln-and-vine", "moss-lane"]),
    );
    expect(slugs.filter((slug) => slug === "fernhollow-nursery")).toHaveLength(2);
    const a = merchantForStore("moss-lane", 1);
    const b = merchantForStore("moss-lane", 2);
    expect(a.storeSlug).toBe("moss-lane");
    expect(a.email).not.toBe(b.email);
  });
});

describe("buildPlan", () => {
  it("is reproducible and sized to the spec ranges", () => {
    const options = {
      seed: "2026-10-01T06",
      runNumber: 12,
      date: new Date("2026-10-01T06:00:00Z"),
    };
    const first = buildPlan(options);
    const second = buildPlan(options);
    expect(first).toEqual(second);
    const shoppers = first.filter((s) => s.kind === "shopper");
    const merchants = first.filter((s) => s.kind === "merchant");
    expect(shoppers.length).toBeGreaterThanOrEqual(SHOPPER_SESSIONS.min);
    expect(shoppers.length).toBeLessThanOrEqual(SHOPPER_SESSIONS.max + CONVERSATION_SESSIONS.max);
    expect(merchants.length).toBeGreaterThanOrEqual(MERCHANT_SESSIONS.min);
    expect(merchants.length).toBeLessThanOrEqual(MERCHANT_SESSIONS.max + CONVERSATION_SESSIONS.max);
    expect(new Set(first.map((s) => s.id)).size).toBe(first.length);
    expect(merchants.every((m) => m.extra === undefined)).toBe(true);
    for (const session of shoppers) {
      expect(SHOPPER_SCENARIOS.map((s) => s.value)).toContain(session.scenario);
      expect(VIEWPORTS.map((v) => v.value)).toContain(session.viewport);
    }
  });

  it("scales with the multiplier and adds an extra on every tenth run", () => {
    const base = buildPlan({ seed: "x", runNumber: 20, date: new Date("2026-10-01T06:00:00Z") });
    const tripled = buildPlan({
      seed: "x",
      runNumber: 20,
      multiplier: 3,
      date: new Date("2026-10-01T06:00:00Z"),
    });
    expect(tripled.length).toBeGreaterThan(base.length * 2);
    expect(base.filter((s) => s.kind === "merchant" && s.extra)).toHaveLength(1);
  });
});

describe("conversation sessions", () => {
  it("adds about thirty assistant conversations on a weekday", () => {
    let conversations = 0;
    const runsPerWeekday = 9;
    const days = 20;
    for (let day = 0; day < days; day += 1) {
      for (let run = 0; run < runsPerWeekday; run += 1) {
        const plan = buildPlan({
          seed: `day-${day}-run-${run}`,
          runNumber: day * runsPerWeekday + run + 1,
          date: new Date(Date.UTC(2026, 9, 1 + day, 6 + run * 2)),
        });
        conversations += plan.filter((s) => s.scenario === "chat").length;
      }
    }
    const perDay = conversations / days;
    expect(perDay).toBeGreaterThan(24);
    expect(perDay).toBeLessThan(38);
  });
});

describe("buildConversationPlan", () => {
  const date = new Date("2026-10-09T09:30:00Z");

  it("makes every session a chat, split between the assistants, with no repeated topic", () => {
    const plan = buildConversationPlan({ seed: "c1", runNumber: 1, count: 8, date });
    expect(plan).toHaveLength(8);
    expect(plan.every((session) => session.scenario === "chat" && session.intent)).toBe(true);
    const shoppers = plan.filter((session) => session.kind === "shopper");
    const merchants = plan.filter((session) => session.kind === "merchant");
    expect(shoppers).toHaveLength(4);
    expect(merchants).toHaveLength(4);
    expect(new Set(shoppers.map((session) => session.intent)).size).toBe(4);
    expect(new Set(plan.map((session) => session.id)).size).toBe(plan.length);
  });

  it("walks through every intent across consecutive runs", () => {
    for (const persona of ["shopper", "merchant"] as const) {
      const seen = new Set<string>();
      const runs = Math.ceil(intentsFor(persona).length / 4);
      for (let run = 1; run <= runs; run += 1) {
        for (const session of buildConversationPlan({ seed: `r${run}`, runNumber: run, date })) {
          if (session.kind === persona && session.intent) seen.add(session.intent);
        }
      }
      expect(seen.size).toBe(intentsFor(persona).length);
    }
  });

  it("can talk to one assistant only", () => {
    const plan = buildConversationPlan({
      seed: "m",
      runNumber: 3,
      count: 5,
      persona: "merchant",
      date,
    });
    expect(plan).toHaveLength(5);
    expect(plan.every((session) => session.kind === "merchant")).toBe(true);
  });
});
