import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the password it hashed and rejects others", () => {
    const stored = hashPassword("leafwright-demo");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("leafwright-demo", stored)).toBe(true);
    expect(verifyPassword("nope", stored)).toBe(false);
  });

  it("is deterministic for a fixed salt", () => {
    expect(hashPassword("x", "ab".repeat(16))).toBe(hashPassword("x", "ab".repeat(16)));
  });

  it("rejects malformed stored values", () => {
    expect(verifyPassword("x", "plain")).toBe(false);
    expect(verifyPassword("x", "bcrypt$a$b")).toBe(false);
  });
});
