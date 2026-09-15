import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Streams a chat completion from Groq (OpenAI-compatible SSE). Yields the
 * answer text incrementally so clients can render it word-by-word.
 */
export async function* groqChatCompletionStream(
  system: string,
  question: string,
  temperature = 0.2,
): AsyncGenerator<string> {
  if (!env.GROQ_API_KEY) {
    throw new AppError('AI assistant is not configured (GROQ_API_KEY missing)', 503);
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: question },
      ],
      temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new AppError(`Groq request failed (${response.status}): ${text.slice(0, 200)}`, 502);
  }

  if (!response.body) {
    throw new AppError('Groq returned an empty stream', 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') return;

        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore malformed keep-alive frames.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}