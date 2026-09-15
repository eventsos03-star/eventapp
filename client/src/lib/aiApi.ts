export interface AiSource {
  source: string;
  section: string;
}

export interface AiAnswer {
  answer: string;
  sources: AiSource[];
}

export type AiStreamHandlers = {
  onDelta: (text: string) => void
  onSources: (sources: AiSource[]) => void
}

/**
 * Streams the RAG answer from POST /api/ai/ask (SSE). Calls onDelta for each
 * chunk of the answer and onSources once the sources arrive at the end.
 */
export async function askAiDocs(
  question: string,
  handlers: AiStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const response: Response = await fetch("/api/ai/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
    signal,
  })

  if (!response.ok) {
    let message = "Something went wrong. Try again."
    try {
      const body = (await response.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
      // ignore parse errors, keep fallback message
    }
    throw new Error(message)
  }

  if (!response.body) {
    throw new Error("The assistant stream is unavailable.")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split("\n\n")
      buffer = events.pop() ?? ""

      for (const event of events) {
        const line = event.trim()
        if (!line.startsWith("data:")) continue
        const payload = line.slice(5).trim()
        if (payload === "[DONE]") return

        try {
          const parsed = JSON.parse(payload) as {
            delta?: string
            sources?: AiSource[]
            error?: string
            done?: boolean
          }
          if (parsed.error) throw new Error(parsed.error)
          if (typeof parsed.delta === "string") handlers.onDelta(parsed.delta)
          if (parsed.sources) handlers.onSources(parsed.sources)
          if (parsed.done) return
        } catch (err) {
          if (err instanceof Error && err.message) throw err
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}