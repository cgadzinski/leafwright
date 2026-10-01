import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryAdapter } from "@/lib/db/memory";
import { db, useAdapter } from "@/lib/db";
import { authenticate } from "./credentials";

describe("authenticate", () => {
  const original = process.env.DEMO_PASSWORD;

  beforeEach(() => {
    useAdapter(new MemoryAdapter());
    delete process.env.DEMO_PASSWORD;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.DEMO_PASSWORD;
    else process.env.DEMO_PASSWORD = original;
  });

  it("accepts the seeded password for a seeded user", async () => {
    const [user] = await db.users.list();
    const result = await authenticate({
      email: user.email.toUpperCase(),
      password: "leafwright-demo",
    });
    expect(result?.id).toBe(user.id);
  });

  it("accepts the environment override", async () => {
    process.env.DEMO_PASSWORD = "rotated";
    const [user] = await db.users.list();
    expect(await authenticate({ email: user.email, password: "rotated" })).not.toBeNull();
    expect(await authenticate({ email: user.email, password: "leafwright-demo" })).not.toBeNull();
  });

  it("rejects unknown users, wrong passwords, and malformed input", async () => {
    const [user] = await db.users.list();
    expect(
      await authenticate({ email: "nobody@example.com", password: "leafwright-demo" }),
    ).toBeNull();
    expect(await authenticate({ email: user.email, password: "wrong" })).toBeNull();
    expect(await authenticate({ email: "not-an-email", password: "x" })).toBeNull();
    expect(await authenticate(undefined)).toBeNull();
  });
});
