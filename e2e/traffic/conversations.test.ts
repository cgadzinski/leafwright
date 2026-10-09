import { describe, expect, it } from "vitest";
import { SUGGESTED_PROMPTS } from "../../lib/chat/prompts";
import { intentRotation, intentsFor, planConversation, type Persona } from "./conversations";
import { Rng } from "./rng";

const personas: Persona[] = ["shopper", "merchant"];

describe("conversation intents", () => {
  it.each(personas)("covers every scope for the %s assistant with unique names", (persona) => {
    const intents = intentsFor(persona);
    expect(new Set(intents.map((intent) => intent.name)).size).toBe(intents.length);
    for (const scope of ["supported", "unsupported", "off-topic"] as const) {
      expect(intents.some((intent) => intent.scope === scope)).toBe(true);
    }
  });

  it.each(personas)("ties %s suggestion chips to their first opener", (persona) => {
    for (const intent of intentsFor(persona)) {
      if (intent.suggestion === undefined) continue;
      expect(SUGGESTED_PROMPTS[persona][intent.suggestion]).toBe(intent.openers[0]);
    }
  });
});

describe("planConversation", () => {
  it("is deterministic for a seed", () => {
    expect(planConversation(new Rng(7), "shopper")).toEqual(
      planConversation(new Rng(7), "shopper"),
    );
  });

  it("mixes scopes, lengths, and pivots across many conversations", () => {
    const rng = new Rng("mix");
    const plans = Array.from({ length: 2000 }, (_, i) =>
      planConversation(rng, i % 2 ? "merchant" : "shopper"),
    );
    const share = (predicate: (plan: (typeof plans)[number]) => boolean) =>
      plans.filter(predicate).length / plans.length;

    expect(share((plan) => plan.scope === "unsupported")).toBeGreaterThan(0.33);
    expect(share((plan) => plan.scope === "unsupported")).toBeLessThan(0.47);
    expect(share((plan) => plan.turns.length > 1)).toBeGreaterThan(0.55);
    expect(share((plan) => plan.pivot !== undefined)).toBeGreaterThan(0.05);

    for (const plan of plans) {
      expect(plan.turns.length).toBeGreaterThanOrEqual(1);
      expect(plan.turns.length).toBeLessThanOrEqual(4);
      expect(plan.turnScopes).toHaveLength(plan.turns.length);
      expect(plan.turnScopes[0]).toBe(plan.scope);
      if (plan.pivot) {
        expect(plan.scope).toBe("supported");
        expect(plan.turnScopes.filter((scope) => scope === "unsupported")).toHaveLength(1);
      }
    }
  });
});

describe("fixed intents", () => {
  it("keeps the requested topic and its scope", () => {
    const rng = new Rng("fixed");
    for (let i = 0; i < 50; i += 1) {
      const plan = planConversation(rng, "merchant", "refund-order");
      expect(plan.intent).toBe("refund-order");
      expect(plan.scope).toBe("unsupported");
    }
  });

  it("rejects an intent the persona does not have", () => {
    expect(() => planConversation(new Rng(1), "shopper", "refund-order")).toThrow();
  });

  it.each(personas)("rotates %s intents through the whole bank and wraps around", (persona) => {
    const intents = intentsFor(persona);
    const cycle = intentRotation(persona, 0, intents.length);
    expect(new Set(cycle)).toEqual(new Set(intents.map((intent) => intent.name)));
    expect(intentRotation(persona, intents.length, 3)).toEqual(cycle.slice(0, 3));
  });

  it.each(personas)("mixes scopes within every four consecutive %s conversations", (persona) => {
    const scopeOf = new Map(intentsFor(persona).map((intent) => [intent.name, intent.scope]));
    const length = intentsFor(persona).length;
    for (let start = 0; start < length; start += 1) {
      const scopes = new Set(intentRotation(persona, start, 4).map((name) => scopeOf.get(name)));
      expect(scopes.has("unsupported")).toBe(true);
      expect(scopes.size).toBeGreaterThan(1);
    }
  });
});
