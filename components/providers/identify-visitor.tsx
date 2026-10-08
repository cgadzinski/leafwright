"use client";

import { useEffect } from "react";
import type { IdentifyOptions } from "@/types/global";

export function IdentifyVisitor({ identity }: { identity: IdentifyOptions }) {
  // A server re-render (after sign-in or a profile, follow, or plan change) passes a new
  // object, so the latest metadata is sent again.
  useEffect(() => {
    window.pendo?.identify(identity);
  }, [identity]);

  return null;
}
