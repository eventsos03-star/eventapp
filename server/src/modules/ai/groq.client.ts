import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

export async function groqChatCompletion(question: string, system: string, temperature = 0.2): Promise<string> {
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
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new AppError(`Groq request failed (${response.status}): ${text.slice(0, 200)}`, 502);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new AppError('Groq returned an empty answer', 502);

  return content;
}