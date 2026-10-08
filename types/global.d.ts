type MetadataValue = string | number | boolean | string[] | null | undefined;

/** Visitor metadata, plus the account for merchants, as `initialize` and `identify` accept it. */
export interface IdentifyOptions {
  visitor: { id: string; [field: string]: MetadataValue };
  account?: { id: string; [field: string]: MetadataValue };
}

declare global {
  interface Window {
    /**
     * Set up by the inline script in `app/layout.tsx`. `initialize` and `identify` are queued
     * until the agent loads; `clearSession` only exists once it has.
     */
    pendo?: {
      initialize(options: IdentifyOptions): void;
      identify(options: IdentifyOptions): void;
      clearSession?(): void;
    };
  }
}
