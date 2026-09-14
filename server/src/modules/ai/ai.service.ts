import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import AiEmbedding from './embed.model.js';
import { embedText } from './embedding.service.js';
import { groqChatCompletion } from './groq.client.js';

const SYSTEM_PROMPT = `You are the EventOS support assistant. Answer the user's question using ONLY the provided context below.
Rules:
- If the answer is not in the context, say you don't know and suggest contacting support.
- Be concise, factual, and friendly. Use short paragraphs or bullet points.
- When you use a section of the context, cite it at the end as [Section: <section> — <source>].
- Never invent features, routes, or behaviors that are not in the context.`;

export interface AiSource {
  source: string;
  section: string;
}

export interface AiAnswer {
  answer: string;
  sources: AiSource[];
}

export async function askDocs(question: string): Promise<AiAnswer> {
  const queryVector = await embedText(question);

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
  const prompt = `Question: ${question}\n\nContext:\n${context}`;

  const answer = await groqChatCompletion(prompt, SYSTEM_PROMPT);
  const sources: AiSource[] = results.map((r) => ({ source: r.source, section: r.section }));

  return { answer, sources };
}