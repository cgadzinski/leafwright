import { describe, expect, it } from "vitest";
import { CardSchema, isExpiryValid, isLuhnValid } from "./payment";

const now = new Date("2026-10-01T12:00:00.000Z");

describe("card validation", () => {
  it("accepts Luhn-valid numbers with spaces and rejects others", () => {
    expect(isLuhnValid("4242 4242 4242 4242")).toBe(true);
    expect(isLuhnValid("4242424242424241")).toBe(false);
    expect(isLuhnValid("1234")).toBe(false);
    expect(isLuhnValid("abcd efgh ijkl mnop")).toBe(false);
  });

  it("accepts expiries through the end of the current month", () => {
    expect(isExpiryValid("10/26", now)).toBe(true);
    expect(isExpiryValid("09/2026", now)).toBe(false);
    expect(isExpiryValid("12/30", now)).toBe(true);
    expect(isExpiryValid("13/30", now)).toBe(false);
    expect(isExpiryValid("1030", now)).toBe(false);
  });

  it("validates the card as a whole", () => {
    expect(
      CardSchema.safeParse({ cardNumber: "4242424242424242", cardExpiry: "12/30", cardCvc: "123" })
        .success,
    ).toBe(true);
    expect(
      CardSchema.safeParse({ cardNumber: "4242424242424242", cardExpiry: "12/30", cardCvc: "12" })
        .success,
    ).toBe(false);
  });
});
