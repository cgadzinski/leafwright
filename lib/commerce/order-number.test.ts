import { describe, expect, it } from "vitest";
import { formatOrderNumber, nextOrderNumber, parseOrderNumber } from "./order-number";

describe("order numbers", () => {
  it("formats a sequence with the LW prefix", () => {
    expect(formatOrderNumber(10421)).toBe("LW-10421");
  });

  it("rejects sequences below the first number", () => {
    expect(() => formatOrderNumber(42)).toThrow(RangeError);
  });

  it("parses valid numbers case-insensitively and rejects junk", () => {
    expect(parseOrderNumber("LW-10421")).toBe(10421);
    expect(parseOrderNumber(" lw-10421 ")).toBe(10421);
    expect(parseOrderNumber("LW-1")).toBeNull();
    expect(parseOrderNumber("ORD-10421")).toBeNull();
    expect(parseOrderNumber("")).toBeNull();
  });

  it("starts at LW-10001 when nothing exists", () => {
    expect(nextOrderNumber([])).toBe("LW-10001");
  });

  it("increments past the highest existing number regardless of order", () => {
    expect(nextOrderNumber(["LW-10003", "LW-10160", "LW-10042", "bogus"])).toBe("LW-10161");
  });
});
