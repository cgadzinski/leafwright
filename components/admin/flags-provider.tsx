"use client";

import { OpenFeatureProvider } from "@openfeature/react-sdk";
import { useEffect, useState } from "react";
import { flagContext, setupFlags } from "@/lib/flags";

export function FlagsProvider({ plan, children }: { plan: string; children: React.ReactNode }) {
  // Register the provider during the first render so the initial evaluation already has context.
  const [initialPlan] = useState(() => {
    setupFlags(flagContext(plan));
    return plan;
  });

  useEffect(() => {
    if (plan !== initialPlan) setupFlags(flagContext(plan));
  }, [plan, initialPlan]);

  return (
    <OpenFeatureProvider suspendUntilReady={false} suspendWhileReconciling={false}>
      {children}
    </OpenFeatureProvider>
  );
}
