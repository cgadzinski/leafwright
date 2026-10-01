import { describe, expect, it } from "vitest";
import { z } from "zod";
import { decodeSigned, encodeSigned } from "./cookies";

const schema = z.object({ lines: z.array(z.string()) });

describe("signed cookies", () => {
  it("round-trips a value", () => {
    const raw = encodeSigned({ lines: ["a", "b"] });
    expect(decodeSigned(raw, schema)).toEqual({ lines: ["a", "b"] });
  });

  it("rejects tampered payloads and bad signatures", () => {
    const raw = encodeSigned({ lines: ["a"] });
    const [payload, signature] = raw.split(".");
    const forged = `${Buffer.from(JSON.stringify({ lines: ["z"] })).toString("base64url")}.${signature}`;
    expect(decodeSigned(forged, schema)).toBeUndefined();
    expect(decodeSigned(`${payload}.nope`, schema)).toBeUndefined();
    expect(decodeSigned("garbage", schema)).toBeUndefined();
    expect(decodeSigned(undefined, schema)).toBeUndefined();
  });

  it("rejects values the schema does not accept", () => {
    expect(decodeSigned(encodeSigned({ lines: "x" }), schema)).toBeUndefined();
  });
});
