import { InMemoryProvider, OpenFeature } from "@openfeature/server-sdk";
import { flagConfig, flagContext, type FlagKey } from "./flags.config";

const globalFlags = globalThis as typeof globalThis & { __leafwrightFlagsReady?: Promise<void> };

function ready(): Promise<void> {
  if (!globalFlags.__leafwrightFlagsReady) {
    globalFlags.__leafwrightFlagsReady = OpenFeature.setProviderAndWait(
      new InMemoryProvider(flagConfig),
    );
  }
  return globalFlags.__leafwrightFlagsReady;
}

/** Server-side evaluation of a boolean flag for a store plan. */
export async function isFlagEnabled(flag: FlagKey, plan: string | undefined): Promise<boolean> {
  await ready();
  return OpenFeature.getClient().getBooleanValue(flag, false, flagContext(plan));
}
