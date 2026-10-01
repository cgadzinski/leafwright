"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssistant } from "./assistant-provider";

export function AssistantToggle() {
  const { open, toggle } = useAssistant();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={open ? "Close assistant" : "Open assistant"}
      aria-pressed={open}
      onClick={toggle}
      data-testid="assistant-toggle"
    >
      <MessageCircle />
    </Button>
  );
}
