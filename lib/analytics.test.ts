import { afterEach, describe, expect, it, vi } from "vitest";

const originalKey = process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY;
const originalEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;

async function loadFresh(env: { key?: string; endpoint?: string }) {
  vi.resetModules();
  if (env.key === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY;
  else process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY = env.key;
  if (env.endpoint === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  else process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = env.endpoint;
  delete (globalThis as { __leafwrightEvents?: unknown }).__leafwrightEvents;
  return import("./analytics");
}

describe("analytics wrapper", () => {
  afterEach(() => {
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY;
    else process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY = originalKey;
    if (originalEndpoint === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
    else process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = originalEndpoint;
    vi.unstubAllGlobals();
  });

  it("does nothing without a write key", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { analytics, isAnalyticsEnabled, queuedAnalyticsEvents } = await loadFresh({});
    analytics.track("Promo Applied", { code: "FERN15" });
    analytics.page("Cart");
    expect(isAnalyticsEnabled()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(queuedAnalyticsEvents()).toEqual([]);
  });

  it("queues events when keyed but no endpoint is configured", async () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const { analytics, queuedAnalyticsEvents } = await loadFresh({ key: "wk_test" });
    analytics.track("Products Searched", { query: "fern" });
    expect(queuedAnalyticsEvents()).toHaveLength(1);
    expect(queuedAnalyticsEvents()[0]).toMatchObject({
      type: "track",
      event: "Products Searched",
      properties: { query: "fern" },
      context: { runtime: "server" },
    });
    expect(debug).toHaveBeenCalled();
    debug.mockRestore();
  });

  it("posts events to the endpoint when both are configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const { analytics } = await loadFresh({
      key: "wk_test",
      endpoint: "https://collector.example.com/v1",
    });
    analytics.track("Orders Exported", { count: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://collector.example.com/v1");
    const body = JSON.parse(String(init.body)) as {
      writeKey: string;
      event: string;
      properties: { count: number };
    };
    expect(body).toMatchObject({
      writeKey: "wk_test",
      event: "Orders Exported",
      properties: { count: 3 },
    });
  });
});
