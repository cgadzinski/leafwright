import { describe, expect, it } from "vitest";
import { makePromo } from "./fixtures.test-helpers";
import { evaluatePromo, promoDiscount, promoShipping } from "./promo";

const now = new Date("2026-06-15T12:00:00.000Z");

describe("evaluatePromo", () => {
  it("rejects a missing code", () => {
    expect(evaluatePromo(undefined, now)).toEqual({ ok: false, reason: "not_found" });
  });

  it("rejects inactive codes before checking dates", () => {
    const result = evaluatePromo(makePromo({ isActive: false }), now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("inactive");
  });

  it("rejects codes outside their window", () => {
    const early = evaluatePromo(makePromo({ startsAt: "2026-07-01T00:00:00.000Z" }), now);
    const late = evaluatePromo(makePromo({ endsAt: "2026-06-01T00:00:00.000Z" }), now);
    expect(early.ok === false && early.reason).toBe("not_started");
    expect(late.ok === false && late.reason).toBe("expired");
  });

  it("accepts an active code inside its window", () => {
    expect(evaluatePromo(makePromo(), now).ok).toBe(true);
  });
});

describe("promoDiscount", () => {
  it("takes a rounded percentage off", () => {
    expect(promoDiscount(makePromo({ type: "percent", value: 15 }), 3333)).toBe(500);
  });

  it("caps percent at 100 and fixed at the subtotal", () => {
    expect(promoDiscount(makePromo({ type: "percent", value: 150 }), 2000)).toBe(2000);
    expect(promoDiscount(makePromo({ type: "fixed", value: 5000 }), 2000)).toBe(2000);
  });

  it("takes a fixed amount off", () => {
    expect(promoDiscount(makePromo({ type: "fixed", value: 500 }), 2000)).toBe(500);
  });

  it("gives no merchandise discount for free shipping and nothing on an empty subtotal", () => {
    expect(promoDiscount(makePromo({ type: "free_shipping", value: 0 }), 2000)).toBe(0);
    expect(promoDiscount(makePromo({ type: "fixed", value: 500 }), 0)).toBe(0);
  });
});

describe("promoShipping", () => {
  it("zeroes shipping only for free_shipping promos", () => {
    expect(promoShipping(makePromo({ type: "free_shipping", value: 0 }), 799)).toBe(0);
    expect(promoShipping(makePromo({ type: "percent", value: 10 }), 799)).toBe(799);
  });
});
