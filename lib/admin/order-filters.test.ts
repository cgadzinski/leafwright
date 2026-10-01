import { describe, expect, it } from "vitest";
import { filterRange, filtersToQuery, parseOrderFilters } from "./order-filters";

describe("order filters", () => {
  it("keeps valid values and drops bad ones", () => {
    expect(parseOrderFilters({ status: "paid", from: "2026-09-01", to: "nope" })).toEqual({
      status: "paid",
      from: "2026-09-01",
      to: undefined,
    });
    expect(parseOrderFilters(new URLSearchParams("status=bogus"))).toEqual({
      status: undefined,
      from: undefined,
      to: undefined,
    });
  });

  it("builds an inclusive UTC range and round-trips to a query string", () => {
    const filters = parseOrderFilters({
      from: "2026-09-01",
      to: "2026-09-30",
      status: "fulfilled",
    });
    const range = filterRange(filters);
    expect(range.from?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(range.to?.toISOString()).toBe("2026-09-30T23:59:59.999Z");
    expect(filtersToQuery(filters)).toBe("?status=fulfilled&from=2026-09-01&to=2026-09-30");
    expect(filtersToQuery({})).toBe("");
  });
});
