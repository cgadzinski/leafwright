import { InMemoryProvider, OpenFeature, type EvaluationContext } from "@openfeature/web-sdk";
import { flagConfig, flagContext, FLAGS } from "./flags.config";

export { FLAGS, flagContext };

let configured = false;

/**
 * Points the web SDK at the in-memory flag set and sets the evaluation context. Safe to call
 * more than once; the provider is only registered the first time.
 */
export function setupFlags(context: EvaluationContext): void {
  if (!configured) {
    OpenFeature.setProvider(new InMemoryProvider(flagConfig));
    configured = true;
  }
  void OpenFeature.setContext(context);
}
