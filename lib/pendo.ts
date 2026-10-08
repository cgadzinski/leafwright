/**
 * Browser access to the Pendo agent. Calls are no-ops on the server and until the agent is on
 * the page, so components can record Track Events without checking for it first. The agent
 * attaches the visitor, account, URL, and time to every event.
 */

export type TrackEventProperties = Record<string, string | number | boolean | undefined>;

type AgentMetadata = { id: string } & TrackEventProperties;

interface AgentOptions {
  visitor?: AgentMetadata;
  account?: AgentMetadata;
}

function agent(): Window["pendo"] {
  return typeof window === "undefined" ? undefined : window.pendo;
}

export const pendo = {
  /** Records a Track Event for the current visitor and account. */
  track(event: string, properties: TrackEventProperties = {}): void {
    try {
      agent()?.track(event, properties);
    } catch (error) {
      console.error(`Track Event "${event}" failed`, error);
    }
  },

  /** Updates visitor or account metadata the agent holds, such as a store's plan. */
  updateOptions(options: AgentOptions): void {
    try {
      agent()?.updateOptions(options);
    } catch (error) {
      console.error("Updating visitor or account metadata failed", error);
    }
  },
};
