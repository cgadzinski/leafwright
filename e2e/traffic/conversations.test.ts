import { describe, expect, it } from "vitest";
import { SUGGESTED_PROMPTS } from "../../lib/chat/prompts";
import { intentsFor, planConversation, type Persona } from "./conversations";
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
