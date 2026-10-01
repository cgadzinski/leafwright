import { createHmac, timingSafeEqual } from "node:crypto";
import type { ZodType } from "zod";

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required to sign cookies");
  }
  return "leafwright-development-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Serializes a value as `base64url(json).signature`. */
export function encodeSigned(value: unknown): string {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the decoded value when the signature checks out and the schema accepts it. */
export function decodeSigned<T>(raw: string | undefined, schema: ZodType<T>): T | undefined {
  if (!raw) return undefined;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return undefined;
  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  try {
    const parsed = schema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString()));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export const COOKIE_MAX_AGE_DAYS = 30;

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
};
