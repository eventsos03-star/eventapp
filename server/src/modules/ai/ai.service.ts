import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import AiEmbedding from './embed.model.js';
import { embedText } from './embedding.service.js';
import { groqChatCompletionStream } from './groq.client.js';

const SYSTEM_PROMPT = `You are the EventOS support assistant. Answer professionally, clearly and concisely.
Rules:
- Keep answers short: 1-3 sentences or a few bullet points. No long explanations.
- Help ONLY with EventOS topics: accounts, sign-in, roles, organizations, venues, bookings, events, and platform features.
- Answer ONLY from the provided context. If the context has no answer, say you don't know and suggest contacting support.
- Never invent features, routes, or behaviors that are not in the context.
- If the question is unrelated to EventOS (for example general knowledge, other products, code help, or casual chat), do NOT answer it. Say you are the EventOS assistant and can only help with EventOS questions.
- When you use a section of the context, cite it at the end as [Section: <section> - <source>].
- Use a friendly, professional tone.`;

const GREETING_PATTERN = /^(hi+|hello+|hey+|howdy|good\s*(morning|afternoon|evening)|yo|hola|hiya|sup|thanks|thank you|thanks a lot|ty|cool|great|ok|okay|bye|goodbye|good night|see you)[\s!?.!]*$/i;
const IDENTITY_PATTERN = /(who are you|what can you do\??|what are you\??|what do you do\??|are you a bot|are you human|help me|what is your purpose)/i;

function getIntroResponse(question: string): string | null {
  const trimmed = question.trim().toLowerCase();
  if (!trimmed) {
    return "Hi, I'm the EventOS assistant! What would you like to know about EventOS?";
  }
  if (GREETING_PATTERN.test(trimmed) || IDENTITY_PATTERN.test(trimmed)) {
    return "Hello! I'm the EventOS assistant. I can help with EventOS - accounts, sign-in, roles, organizations, venues, bookings, and events.";
  }
  return null;
}

export interface AiSource {
  source: string;
  section: string;
}

export interface AiAnswer {
  answer: string;
  sources: AiSource[];
}

/**
 * RAG answer pipeline as a stream. Yields answer text deltas first, then a
 * single `{ sources }` object when the answer is complete.
 */
export async function* askDocsStream(question: string): AsyncGenerator<string | { sources: AiSource[] }> {
  const intro = getIntroResponse(question);
  if (intro) {
    yield intro;
    yield { sources: [] };
    return;
  }

  const trimmed = question.trim();
  const queryVector = await embedText(trimmed);

  const results = await AiEmbedding.aggregate<{
    text: string;
    source: string;
    section: string;
    score: number;
  }>([
    {
      $vectorSearch: {
        index: env.AI_VECTOR_INDEX,
        path: 'vector',
        queryVector,
        numCandidates: Math.max(env.AI_TOP_K * 8, 10),
        limit: env.AI_TOP_K,
      },
    },
    {
      $project: {
        text: 1,
        source: 1,
        section: 1,
        score: { $meta: 'searchScore' },
      },
    },
  ]);

  if (results.length === 0) {
    throw new AppError("I couldn't find anything in the EventOS documentation about that.", 404);
  }

  const context = results.map((r) => `[Section: ${r.section} - ${r.source}]\n${r.text}`).join('\n\n');
  const prompt = `Question: ${trimmed}\n\nContext:\n${context}`;

  let answer = '';
  for await (const delta of groqChatCompletionStream(SYSTEM_PROMPT, prompt)) {
    answer += delta;
    yield delta;
  }

  const usedContext = /\[Section\s*:/.test(answer);
  yield {
    sources: usedContext ? results.map((r) => ({ source: r.source, section: r.section })) : [],
  };
}