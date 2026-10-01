import { describe, expect, it } from "vitest";
import { ENTRY_POINTS, SHOPPER_SCENARIOS, VIEWPORTS } from "./config";
import { activeShoppers, buildPlan, merchantForStore, storeForMerchantSession } from "./plan";
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
    expect(shoppers.length).toBeGreaterThanOrEqual(10);
    expect(shoppers.length).toBeLessThanOrEqual(16);
    expect(merchants.length).toBeGreaterThanOrEqual(3);
    expect(merchants.length).toBeLessThanOrEqual(5);
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
