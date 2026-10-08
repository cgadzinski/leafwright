import { after } from "next/server";
import type { Session } from "next-auth";
import type { TrackEventProperties } from "./pendo";

/**
 * Server-side Track Events, for actions that finish on the server: Server Actions that redirect
 * or return nothing, and route handlers. A no-op unless PENDO_TRACK_EVENT_SECRET is set.
 */

const DATA_HOST = process.env.PENDO_DATA_HOST || "data.pendo-dev.pendo-dev.com";
const TRACK_EVENT_SECRET = process.env.PENDO_TRACK_EVENT_SECRET;

/** Stands in for the visitor or account when an event has none, such as a guest checkout. */
export const SYSTEM_ID = "system";

export interface TrackIdentity {
  visitorId: string;
  /** The merchant's store. Shoppers belong to no store, so this defaults to `SYSTEM_ID`. */
  accountId?: string;
}

/** The signed-in user as the visitor and, for merchants, their store as the account. */
export function sessionIdentity(session: Session | null): TrackIdentity {
  return {
    visitorId: session?.user?.id ?? SYSTEM_ID,
    accountId: session?.store?.id ?? SYSTEM_ID,
  };
}

interface TrackPayload {
  type: "track";
  event: string;
  visitorId: string;
  accountId: string;
  timestamp: number;
  properties: TrackEventProperties;
}

async function deliver(payload: TrackPayload, secret: string): Promise<void> {
  try {
    const response = await fetch(`https://${DATA_HOST}/data/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pendo-integration-key": secret },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error(`Track Event "${payload.event}" was rejected with status ${response.status}`);
    }
  } catch (error) {
    console.error(`Track Event "${payload.event}" could not be sent`, error);
  }
}

/**
 * Records a Track Event. Delivery is scheduled with `after()`, so it runs once the response is
 * sent (also when the action ends in `redirect()`), and failures are logged, never thrown.
 */
export function trackServerEvent(
  event: string,
  identity: TrackIdentity,
  properties: TrackEventProperties = {},
): void {
  const secret = TRACK_EVENT_SECRET;
  if (!secret) return;
  const payload: TrackPayload = {
    type: "track",
    event,
    visitorId: identity.visitorId,
    accountId: identity.accountId ?? SYSTEM_ID,
    timestamp: Date.now(),
    properties,
  };
  try {
    after(() => deliver(payload, secret));
  } catch {
    // Outside a request (scripts, tests) there is no response to wait for.
    void deliver(payload, secret);
  }
}
