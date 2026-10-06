"use client";

import Markdown from "./Markdown";
import type { ChatMessage } from "./types";

interface Props {
  message: ChatMessage;
  onRetry?: (id: string) => void;
}

const ERROR_TEXT =
  "Something went wrong while contacting the EventOS assistant. Please try again.";

export default function ChatMessage({ message, onRetry }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl border border-ink-line border-l-2 border-l-amber bg-ink-soft px-4 py-3">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-paper-dim">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3.5">
      <span className="mt-4 h-2 w-2 shrink-0 rounded-full bg-amber" />
      <div className="min-w-0 flex-1">
        <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-amber/80">
          EVENTOS ASSISTANT
        </p>

        {message.isStreaming && !message.content ? (
          <span className="flex items-center gap-1.5 py-2" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber"
                style={{ animationDelay: `${dot * 150}ms` }}
              />
            ))}
          </span>
        ) : message.isStreaming ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-paper-dim/90">
            {message.content}
          </p>
        ) : (
          <>
            <Markdown text={message.content} />

            {message.stopped && (
              <span className="mt-3 block font-mono text-[10px] tracking-[0.16em] text-paper-dim/40">
                STOPPED
              </span>
            )}

            {message.stopped && (
              <button
                type="button"
                onClick={() => onRetry?.(message.id)}
                className="mt-3 rounded-lg border border-ink-line px-3.5 py-1.5 text-xs font-semibold text-paper-dim/70 transition hover:border-amber hover:text-amber"
              >
                Continue
              </button>
            )}

            {message.error && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-sm leading-relaxed text-paper-dim/55">
                  {ERROR_TEXT}
                </p>
                <button
                  type="button"
                  onClick={() => onRetry?.(message.id)}
                  className="rounded-lg border border-amber/50 px-3.5 py-1.5 text-xs font-semibold text-amber transition hover:bg-amber/10"
                >
                  Try again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}