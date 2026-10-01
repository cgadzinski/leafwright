import type { EvaluationContext } from "@openfeature/web-sdk";

export const FLAGS = { MERCHANT_ANALYTICS: "merchant-analytics" } as const;
export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS];

/** Evaluation context carries the store's plan; `pro` stores see merchant analytics. */
export function flagContext(plan: string | undefined): EvaluationContext {
  return { plan: plan ?? "none" };
}

export const flagConfig = {
  [FLAGS.MERCHANT_ANALYTICS]: {
    disabled: false,
    variants: { on: true, off: false },
    defaultVariant: "off",
    contextEvaluator: (context: EvaluationContext) => (context.plan === "pro" ? "on" : "off"),
  },
} as const;
