import { describe, expect, it } from "vitest";
import { flagConfig, flagContext, FLAGS } from "./flags.config";
import { isFlagEnabled } from "./flags.server";

describe("merchant-analytics flag", () => {
  it("is on for pro stores and off otherwise through the server SDK", async () => {
    expect(await isFlagEnabled(FLAGS.MERCHANT_ANALYTICS, "pro")).toBe(true);
    expect(await isFlagEnabled(FLAGS.MERCHANT_ANALYTICS, "growth")).toBe(false);
    expect(await isFlagEnabled(FLAGS.MERCHANT_ANALYTICS, "starter")).toBe(false);
    expect(await isFlagEnabled(FLAGS.MERCHANT_ANALYTICS, undefined)).toBe(false);
  });

  it("defaults off in the shared config", () => {
    const flag = flagConfig[FLAGS.MERCHANT_ANALYTICS];
    expect(flag.defaultVariant).toBe("off");
    expect(flag.contextEvaluator(flagContext("pro"))).toBe("on");
    expect(flag.contextEvaluator(flagContext("growth"))).toBe("off");
  });
});
