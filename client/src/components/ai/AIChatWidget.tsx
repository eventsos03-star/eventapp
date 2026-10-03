"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import { askAssistant } from "@/lib/ai";
import type { ChatMessage as Message } from "./types";

const SUGGESTIONS = [
  "How do I create an event?",
  "How does venue approval work?",
  "Can an event be published before venue approval is complete?",
  "How does event registration work?",
];

let idCounter = 0;
function newId(): string {
  idCounter += 1;
  return `m-${Date.now()}-${idCounter}`;
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const rafRef = useRef(0);

  function startStream(question: string, assistantId: string) {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    const onChunk = (chunk: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: m.content + chunk } : m
        )
      );
    };

    askAssistant(question, controller.signal, onChunk)
      .then((result) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  isStreaming: false,
                  stopped: result.status === "error" && result.aborted,
                }
              : m
          )
        );
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false, error: true } : m
          )
        );
      })
      .finally(() => {
        setIsStreaming(false);
        abortRef.current = null;
      });
  }

  function handleSend(question: string) {
    if (isStreaming) return;
    const trimmed = question.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: newId(), role: "user", content: trimmed };
    const assistantMsg: Message = {
      id: newId(),
      role: "assistant",
      content: "",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    startStream(trimmed, assistantMsg.id);
  }

  function handleRetry(assistantId: string) {
    if (isStreaming) return;
    const index = messages.findIndex((m) => m.id === assistantId);
    const previous = index > 0 ? messages[index - 1] : undefined;
    if (!previous || previous.role !== "user") return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? { ...m, content: "", error: false, stopped: false, isStreaming: true }
          : m
      )
    );
    startStream(previous.content, assistantId);
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!open || !nearBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: isStreaming ? "auto" : "smooth" });
    });
  }, [messages, open, isStreaming]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = distance < 140;
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="EventOS assistant"
          className="fixed bottom-[5.5rem] right-5 z-50 flex h-[min(70dvh,30rem)] min-h-[22rem] w-[calc(100vw-2.5rem)] max-w-[24rem] flex-col overflow-hidden rounded-2xl border border-ink-line bg-[#12151D]/95 shadow-2xl shadow-black/50 backdrop-blur"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-ink-line px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber text-ink">
                <Sparkles size={14} aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold leading-tight text-paper-dim">
                  EventOS Assistant
                </p>
                <p className="font-mono text-[9px] tracking-[0.16em] text-amber/80">
                  ONLINE
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-2 text-paper-dim/60 transition hover:bg-ink-line hover:text-paper-dim"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-5"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-ink-line bg-ink-soft text-amber">
                  <Sparkles size={18} aria-hidden="true" />
                </span>
                <h2 className="mt-3.5 font-display text-lg font-semibold text-paper-dim">
                  Ask EventOS.
                </h2>
                <p className="mt-1.5 max-w-[15rem] text-xs leading-relaxed text-paper-dim/50">
                  Questions about events, venues, bookings and operations,
                  answered instantly.
                </p>

                <div className="mt-5 flex w-full flex-col gap-2 px-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSend(suggestion)}
                      disabled={isStreaming}
                      className="rounded-lg border border-ink-line px-3 py-2.5 text-left text-xs text-paper-dim/70 transition hover:border-amber hover:text-amber disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRetry={handleRetry}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-ink-line p-3">
            <ChatInput
              isStreaming={isStreaming}
              onSend={handleSend}
              onStop={handleStop}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close EventOS assistant" : "Open EventOS assistant"}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-amber text-ink shadow-lg shadow-amber/20 ring-1 ring-ink-line transition hover:bg-amber-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
      >
        {open ? <X size={22} aria-hidden="true" /> : <Sparkles size={22} aria-hidden="true" />}
      </button>
    </>
  );
}