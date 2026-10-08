import type { Session } from "next-auth";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalSecret = process.env.PENDO_TRACK_EVENT_SECRET;
const originalHost = process.env.PENDO_DATA_HOST;

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

async function loadFresh(env: { secret?: string; host?: string }) {
  vi.resetModules();
  restore("PENDO_TRACK_EVENT_SECRET", env.secret);
  restore("PENDO_DATA_HOST", env.host);
  return import("./pendo.server");
}

describe("server track events", () => {
  afterEach(() => {
    restore("PENDO_TRACK_EVENT_SECRET", originalSecret);
    restore("PENDO_DATA_HOST", originalHost);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does nothing without a track event secret", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { trackServerEvent } = await loadFresh({});
    trackServerEvent("Order Placed", { visitorId: "user_1" }, { total: 4200 });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the event with the visitor, account, and properties", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { trackServerEvent } = await loadFresh({
      secret: "test-secret",
      host: "data.example.com",
    });
    trackServerEvent(
      "Order Placed",
      { visitorId: "user_1", accountId: "store_1" },
      { total: 4200, checkoutType: "signed_in" },
    );
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://data.example.com/data/track");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      "x-pendo-integration-key": "test-secret",
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      type: "track",
      event: "Order Placed",
      visitorId: "user_1",
      accountId: "store_1",
      timestamp: expect.any(Number),
      properties: { total: 4200, checkoutType: "signed_in" },
    });
  });

  it("uses system for a missing account and logs failed deliveries", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const { trackServerEvent } = await loadFresh({ secret: "test-secret" });
    expect(() => trackServerEvent("Sign In Failed", { visitorId: "system" })).not.toThrow();
    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://data.pendo-dev.pendo-dev.com/data/track");
    expect(JSON.parse(String(init.body))).toMatchObject({ accountId: "system", properties: {} });
  });

  it("maps a session to the user and, for merchants, their store", async () => {
    const { sessionIdentity } = await loadFresh({});
    const merchant = {
      user: { id: "user_9", email: "owner@example.com", name: "Owner", role: "owner" },
      store: { id: "store_1", name: "Fern", slug: "fern", plan: "pro", trialEndsAt: null },
      expires: "2030-01-01T00:00:00.000Z",
    } satisfies Session;
    expect(sessionIdentity(merchant)).toEqual({ visitorId: "user_9", accountId: "store_1" });
    expect(sessionIdentity({ ...merchant, store: null })).toEqual({
      visitorId: "user_9",
      accountId: "system",
    });
    expect(sessionIdentity(null)).toEqual({ visitorId: "system", accountId: "system" });
  });
});
