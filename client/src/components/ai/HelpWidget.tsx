"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, Send, X, Loader2 } from "lucide-react";
import { askAiDocs, type AiSource } from "@/lib/aiApi";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: AiSource[];
  streaming?: boolean;
}

let nextId = 1;

export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const patchMessage = (id: number, updater: (m: ChatMessage) => ChatMessage) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));

  const setText = (id: number, text: string) =>
    patchMessage(id, (m) => ({ ...m, text, streaming: false }));

  const appendDelta = (id: number, text: string) =>
    patchMessage(id, (m) => ({ ...m, text: m.text + text, streaming: true }));

  const setSources = (id: number, sources: AiSource[]) =>
    patchMessage(id, (m) => ({ ...m, sources }));

  const finish = (id: number) => patchMessage(id, (m) => ({ ...m, streaming: false }));

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsgId = nextId++;
    const aiMsgId = nextId++;

    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text: question }]);
    setMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", text: "", streaming: true }]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      await askAiDocs(question, {
        onDelta: (text) => appendDelta(aiMsgId, text),
        onSources: (sources) => setSources(aiMsgId, sources),
      });
    } catch (err: any) {
      const message = err?.message ?? "Sorry, something went wrong. Try again.";
      setText(aiMsgId, message);
    } finally {
      finish(aiMsgId);
      setLoading(false);
    }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="EventOS help assistant"
        className="fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-400"
      >
        {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-[88px] right-5 z-50 flex h-[480px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1220] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-amber-400 text-sm font-black border border-white/10">
              E
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">EventOS Helper</p>
              <p className="text-[11px] text-slate-400">Ask anything about the platform</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-400">
                Example: "How do I get my venue approved?" or "What is the difference between soft-delete and
                permanent-delete?"
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-amber-500 text-slate-950"
                      : "border border-white/10 bg-white/[0.03] text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {m.text}
                    {m.streaming && <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-amber-400 align-middle" />}
                  </p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.sources.map((s, i) => (
                        <span
                          key={i}
                          className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300"
                          title={`${s.source} — ${s.section}`}
                        >
                          {s.section}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (!lastAssistant || lastAssistant.text === "") && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                  Thinking…
                </div>
              </div>
            )}
            {error && <p className="text-[11px] text-red-400">{error}</p>}
          </div>

          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
                placeholder="Type your question…"
                disabled={loading}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                aria-label="Send question"
                className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500 text-slate-950 transition hover:bg-amber-400 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}