import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { describe, expect, it, vi } from "vitest";
import type { Store } from "@/lib/db/schema";
import { jwtCallback, sessionCallback } from "./callbacks";

const baseToken: JWT = { id: "", role: "shopper", sub: "user_1", email: "old@example.com" };
const now = new Date("2026-10-01T12:00:00.000Z");

const fernhollow: Store = {
  id: "store_fernhollow",
  slug: "fernhollow-nursery",
  name: "Fernhollow Nursery",
  description: "",
  plan: "pro",
  region: "Portland, OR",
  createdAt: "2025-01-01T00:00:00.000Z",
};

describe("jwt callback", () => {
  it("copies role and storeId onto the token and stamps the sign-in on first call", async () => {
    const stampSignIn = vi.fn().mockResolvedValue(undefined);
    const token = await jwtCallback(
      {
        token: baseToken,
        user: {
          id: "user_7",
          email: "owner@fernhollow-nursery.example.com",
          name: "Amari Rohan",
          role: "owner",
          storeId: "store_fernhollow",
        },
      },
      { stampSignIn, now: () => now },
    );
    expect(token).toMatchObject({
      id: "user_7",
      role: "owner",
      storeId: "store_fernhollow",
      email: "owner@fernhollow-nursery.example.com",
      name: "Amari Rohan",
    });
    expect(stampSignIn).toHaveBeenCalledWith("user_7", now.toISOString());
  });

  it("leaves the token alone and does not stamp on later calls", async () => {
    const stampSignIn = vi.fn();
    const token: JWT = { ...baseToken, id: "user_7", role: "staff", storeId: "store_dry" };
    expect(await jwtCallback({ token }, { stampSignIn })).toBe(token);
    expect(stampSignIn).not.toHaveBeenCalled();
  });

  it("keeps shoppers without a store", async () => {
    const token = await jwtCallback(
      { token: baseToken, user: { id: "user_20", email: "z@example.com", role: "shopper" } },
      { stampSignIn: async () => undefined, now: () => now },
    );
    expect(token.role).toBe("shopper");
    expect(token.storeId).toBeUndefined();
  });
});

describe("session callback", () => {
  const session = {
    user: { id: "", email: "", name: "", role: "shopper" },
    store: null,
    expires: "2026-11-01T00:00:00.000Z",
  } satisfies Session;

  it("exposes the merchant's store", async () => {
    const result = await sessionCallback(
      {
        session,
        token: {
          id: "user_7",
          role: "owner",
          storeId: "store_fernhollow",
          email: "owner@fernhollow-nursery.example.com",
          name: "Amari Rohan",
        },
      },
      { loadStore: async () => fernhollow },
    );
    expect(result.user).toEqual({
      id: "user_7",
      email: "owner@fernhollow-nursery.example.com",
      name: "Amari Rohan",
      role: "owner",
    });
    expect(result.store).toEqual({
      id: "store_fernhollow",
      name: "Fernhollow Nursery",
      slug: "fernhollow-nursery",
      plan: "pro",
      trialEndsAt: null,
    });
  });

  it("sets store to null for shoppers without touching the store lookup", async () => {
    const loadStore = vi.fn();
    const result = await sessionCallback(
      { session, token: { id: "user_20", role: "shopper", email: "z@example.com", name: "Z" } },
      { loadStore },
    );
    expect(result.store).toBeNull();
    expect(result.user.role).toBe("shopper");
    expect(loadStore).not.toHaveBeenCalled();
  });

  it("sets store to null when the store no longer exists", async () => {
    const result = await sessionCallback(
      { session, token: { id: "user_9", role: "staff", storeId: "store_gone", email: "s@x.io" } },
      { loadStore: async () => undefined },
    );
    expect(result.store).toBeNull();
  });

  it("surfaces the trial end date", async () => {
    const result = await sessionCallback(
      { session, token: { id: "u", role: "owner", storeId: "store_moss", email: "o@x.io" } },
      {
        loadStore: async () => ({
          ...fernhollow,
          id: "store_moss",
          plan: "starter",
          trialEndsAt: "2026-10-12T12:00:00.000Z",
        }),
      },
    );
    expect(result.store?.trialEndsAt).toBe("2026-10-12T12:00:00.000Z");
  });
});
