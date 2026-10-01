"use client";

import { RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UiMessage } from "./use-chat";

/** Turns bare `/products/{slug}` paths into links. */
function renderContent(content: string) {
  const parts = content.split(/(\/products\/[a-z0-9-]+)/g);
  return parts.map((part, index) =>
    /^\/products\/[a-z0-9-]+$/.test(part) ? (
      <Link key={index} href={part} className="underline">
        {part}
      </Link>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function ChatMessageBubble({
  message,
  streaming,
  onRate,
  onRetry,
}: {
  message: UiMessage;
  streaming: boolean;
  onRate: (id: string, value: "up" | "down") => void;
  onRetry: (id: string) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}
      data-role={message.role}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {message.content ? (
          renderContent(message.content)
        ) : (
          <span className="text-muted-foreground">…</span>
        )}
      </div>
      {!isUser && !streaming && message.content ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Helpful"
            aria-pressed={message.rating === "up"}
            className={cn(message.rating === "up" && "text-emerald-700")}
            onClick={() => onRate(message.id, "up")}
            data-testid={`chat-rate-up-${message.id}`}
          >
            <ThumbsUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Not helpful"
            aria-pressed={message.rating === "down"}
            className={cn(message.rating === "down" && "text-rose-700")}
            onClick={() => onRate(message.id, "down")}
            data-testid={`chat-rate-down-${message.id}`}
          >
            <ThumbsDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Try again"
            onClick={() => onRetry(message.id)}
            data-testid={`chat-retry-${message.id}`}
          >
            <RefreshCw />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
