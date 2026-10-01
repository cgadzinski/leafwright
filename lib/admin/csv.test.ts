import { describe, expect, it } from "vitest";
import { csvEscape, toCsv } from "./csv";

describe("csv", () => {
  it("quotes values with commas, quotes, or newlines", () => {
    expect(csvEscape("plain")).toBe("plain");
    expect(csvEscape('Kiln & Vine, "Asheville"')).toBe('"Kiln & Vine, ""Asheville"""');
    expect(csvEscape("a\nb")).toBe('"a\nb"');
    expect(csvEscape(undefined)).toBe("");
  });

  it("joins rows with CRLF and a trailing newline", () => {
    expect(
      toCsv([
        ["a", "b"],
        [1, "x,y"],
      ]),
    ).toBe('a,b\r\n1,"x,y"\r\n');
  });
});
