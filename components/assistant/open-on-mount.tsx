"use client";

import { useEffect } from "react";
import { useAssistant } from "./assistant-provider";

/** Opens the assistant panel when the page mounts (used by /help). */
export function OpenAssistantOnMount() {
  const { setOpen } = useAssistant();
  useEffect(() => {
    setOpen(true);
  }, [setOpen]);
  return null;
}
