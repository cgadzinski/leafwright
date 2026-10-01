/**
 * In-house analytics wrapper. It is a no-op unless NEXT_PUBLIC_ANALYTICS_WRITE_KEY is set, so
 * local development and the public demo send nothing. With a key, events go to
 * NEXT_PUBLIC_ANALYTICS_ENDPOINT when configured; otherwise they are queued in memory and
 * logged at debug level until a collector is chosen.
 */

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsEvent {
  type: "track" | "page";
  event?: string;
  name?: string;
  properties: AnalyticsProperties;
  timestamp: string;
  context: { path?: string; userAgent?: string; runtime: "browser" | "server" };
}

const WRITE_KEY = process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY;
const ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;

const queueHolder = globalThis as typeof globalThis & { __leafwrightEvents?: AnalyticsEvent[] };

export function isAnalyticsEnabled(): boolean {
  return Boolean(WRITE_KEY);
}

function context(): AnalyticsEvent["context"] {
  if (typeof window !== "undefined") {
    return { path: window.location.pathname, userAgent: navigator.userAgent, runtime: "browser" };
  }
  return { runtime: "server" };
}

function deliver(payload: AnalyticsEvent): void {
  if (!WRITE_KEY) return;
  const body = JSON.stringify({ writeKey: WRITE_KEY, ...payload });
  if (!ENDPOINT) {
    (queueHolder.__leafwrightEvents ??= []).push(payload);
    console.debug("[analytics]", payload.type, payload.event ?? payload.name, payload.properties);
    return;
  }
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never break the product; drop the event.
  });
}

export const analytics = {
  track(event: string, properties: AnalyticsProperties = {}): void {
    deliver({
      type: "track",
      event,
      properties,
      timestamp: new Date().toISOString(),
      context: context(),
    });
  },
  page(name?: string, properties: AnalyticsProperties = {}): void {
    deliver({
      type: "page",
      name,
      properties,
      timestamp: new Date().toISOString(),
      context: context(),
    });
  },
};

/** Events held in memory when a key is set but no endpoint is; useful in tests and debugging. */
export function queuedAnalyticsEvents(): AnalyticsEvent[] {
  return queueHolder.__leafwrightEvents ?? [];
}
