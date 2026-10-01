import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges conditional class names", () => {
    expect(cn("px-2", false && "hidden", "py-1")).toBe("px-2 py-1");
  });

  it("lets the last conflicting utility win", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
