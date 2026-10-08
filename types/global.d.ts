type MetadataValue = string | number | boolean | string[] | null | undefined;

/** Metadata the agent records for a conversation event; see `pendo.trackAgent`. */
export interface AgentEventMetadata {
  agentId: string;
  conversationId: string;
  messageId: string;
  content: string;
  modelUsed?: string;
  suggestedPrompt?: boolean;
  toolsUsed?: string[];
  fileUploaded?: boolean;
}

export type AgentEventType = "prompt" | "agent_response" | "user_reaction";

/** Visitor metadata, plus the account for merchants, as `initialize` and `identify` accept it. */
export interface IdentifyOptions {
  visitor: { id: string; [field: string]: MetadataValue };
  account?: { id: string; [field: string]: MetadataValue };
}

declare global {
  interface Window {
    /**
     * Set up by the inline script in `app/layout.tsx`. `initialize`, `identify`, `updateOptions`,
     * and `track` are queued until the agent loads; `clearSession` only exists once it has.
     */
    pendo?: {
      initialize(options: IdentifyOptions): void;
      identify(options: IdentifyOptions): void;
      updateOptions(options: Partial<IdentifyOptions>): void;
      track(event: string, properties?: Record<string, MetadataValue>): void;
      /** Only defined once the agent has loaded. */
      trackAgent?(eventType: AgentEventType, metadata: AgentEventMetadata): void;
      clearSession?(): void;
    };
  }
}
