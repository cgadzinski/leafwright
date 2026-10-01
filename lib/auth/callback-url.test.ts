import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "./callback-url";

describe("safeCallbackUrl", () => {
  it("keeps same-origin paths", () => {
    expect(safeCallbackUrl("/account/orders?page=2")).toBe("/account/orders?page=2");
  });

  it("falls back for empty, absolute, or protocol-relative values", () => {
    expect(safeCallbackUrl(undefined)).toBe("/");
    expect(safeCallbackUrl("https://evil.example.com")).toBe("/");
    expect(safeCallbackUrl("//evil.example.com")).toBe("/");
    expect(safeCallbackUrl("", "/admin")).toBe("/admin");
  });
});
