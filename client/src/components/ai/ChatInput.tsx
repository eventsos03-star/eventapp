"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";

interface Props {
  isStreaming: boolean;
  onSend: (question: string) => void;
  onStop: () => void;
}

export default function ChatInput({ isStreaming, onSend, onStop }: Props) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !isStreaming;

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSend) submit();
    }
  }

  function submit() {
    const question = value.trim();
    if (!question) return;
    setValue("");
    onSend(question);
  }

  return (
    <div className="rounded-xl border border-ink-line bg-ink-soft/60 p-2 transition focus-within:border-amber">
      <textarea
        aria-label="Message the EventOS assistant"
        rows={2}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about EventOS..."
        className="max-h-40 w-full resize-none bg-transparent px-2.5 py-2 text-[15px] leading-relaxed text-paper-dim outline-none placeholder:text-paper-dim/35"
      />

      <div className="mt-1 flex items-center justify-between gap-3 px-1">
        <span className="hidden font-mono text-[10px] tracking-[0.12em] text-paper-dim/35 sm:block">
          ENTER TO ASK · SHIFT+ENTER FOR A NEW LINE
        </span>
        <span className="font-mono text-[10px] tracking-[0.12em] text-paper-dim/35 sm:hidden">
          ENTER TO ASK
        </span>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="flex shrink-0 items-center gap-2 rounded-lg border border-amber/60 px-3.5 py-2 text-sm font-semibold text-amber transition hover:bg-amber/10"
          >
            <Square size={14} aria-hidden="true" />
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Ask"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:bg-amber-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={14} aria-hidden="true" />
            Ask
          </button>
        )}
      </div>
    </div>
  );
}