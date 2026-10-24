export type AskResult =
  | { status: "done" }
  | { status: "error"; aborted: boolean };

const FRIENDLY_ERROR =
  "Something went wrong while contacting the EventOS assistant. Please try again.";

// Hard cap on a single request (connect + full stream). Without this, a dead
// or stalled connection leaves the chat widget waiting forever with no way to
// recover except a page reload.
const REQUEST_TIMEOUT_MS = 60_000;

interface AskEvent {
  type?: string;
  content?: string;
  message?: string;
}

/**
 * Streams an answer from POST /api/ai/ask (JSON-over-SSE) without EventSource,
 * because the request is a POST. Chunks are appended via onChunk as they arrive.
 */
export async function askAssistant(
  question: string,
  signal: AbortSignal,
  onChunk: (chunk: string) => void
): Promise<AskResult> {
  // One controller drives the fetch; the caller's signal (Stop button /
  // unmount) and the timeout both abort through it, so we can tell a user
  // stop apart from a timeout.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  if (signal.aborted) controller.abort();
  else signal.addEventListener('abort', onCallerAbort, { once: true });

  try {
    let response: Response;
    try {
      response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) throw new Error(FRIENDLY_ERROR);
      if (isAbortError(error)) return { status: "error", aborted: true };
      throw new Error(FRIENDLY_ERROR);
    }

    if (!response.ok) {
      // Validation / rate limiting: surface a clean message, never internals.
      throw new Error(FRIENDLY_ERROR);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/event-stream")) {
      throw new Error(FRIENDLY_ERROR);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error(FRIENDLY_ERROR);

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const dataLine = frame
            .split("\n")
            .find((line) => line.startsWith("data:"));
          if (!dataLine) continue;

          const payload = dataLine.slice(5).trim();
          if (!payload) continue;

          let event: AskEvent;
          try {
            event = JSON.parse(payload) as AskEvent;
          } catch {
            continue;
          }

          if (event.type === "chunk" && typeof event.content === "string") {
            onChunk(event.content);
          } else if (event.type === "done") {
            return { status: "done" };
          } else if (event.type === "error") {
            throw new Error(FRIENDLY_ERROR);
          }
        }
      }
    } catch (error) {
      if (timedOut) throw new Error(FRIENDLY_ERROR);
      if (isAbortError(error)) return { status: "error", aborted: true };
      throw error;
    }

    // Stream closed without a done event.
    throw new Error(FRIENDLY_ERROR);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onCallerAbort);
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}