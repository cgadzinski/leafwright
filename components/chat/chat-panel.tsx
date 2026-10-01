"use client";

import { SendHorizontal, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAssistant } from "@/components/assistant/assistant-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PERSONA_COPY, SUGGESTED_PROMPTS } from "@/lib/chat/prompts";
import type { Persona } from "@/lib/db/schema";
import { ChatMessageBubble } from "./chat-message";
import { useChat } from "./use-chat";

export function ChatPanel({ persona }: { persona: Persona }) {
  const { open, setOpen } = useAssistant();
  const { messages, input, setInput, status, submit, rate, retry } = useChat(persona);
  const copy = PERSONA_COPY[persona];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  if (!open) return null;

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-xl"
      role="dialog"
      aria-label={copy.title}
      data-testid="chat-panel"
    >
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="font-medium">{copy.title}</p>
          <p className="text-xs text-muted-foreground">
            {persona === "shopper" ? "Knows every nursery's catalog" : "Reads your store's orders"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close assistant"
          onClick={() => setOpen(false)}
          data-testid="chat-close"
        >
          <X />
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{copy.intro}</p>
            <div className="flex flex-col gap-2">
              {SUGGESTED_PROMPTS[persona].map((prompt, index) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  className="justify-start"
                  onClick={() => submit(prompt)}
                  data-testid={`chat-suggestion-${index}`}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {messages.map((message, index) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            streaming={status === "streaming" && index === messages.length - 1}
            onRate={rate}
            onRetry={retry}
          />
        ))}
      </div>

      <form
        className="flex items-center gap-2 border-t px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={copy.placeholder}
          aria-label="Message"
          disabled={status === "streaming"}
          data-testid="chat-input"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          disabled={status === "streaming" || !input.trim()}
          data-testid="chat-send"
        >
          <SendHorizontal />
        </Button>
      </form>
    </aside>
  );
}
