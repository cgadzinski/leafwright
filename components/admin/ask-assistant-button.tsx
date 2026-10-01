"use client";

import { Sparkles } from "lucide-react";
import { useAssistant } from "@/components/assistant/assistant-provider";
import { Button } from "@/components/ui/button";

export function AskAssistantButton() {
  const { setOpen } = useAssistant();
  return (
    <Button variant="outline" onClick={() => setOpen(true)} data-testid="admin-ask-assistant">
      <Sparkles /> Ask the assistant
    </Button>
  );
}
