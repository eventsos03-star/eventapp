import dotenv from 'dotenv';

dotenv.config();

const EMBEDDING_BASE_URL = process.env.EMBEDDING_BASE_URL || 'https://api.openai.com/v1';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.EMBEDDING_API_KEY;

  if (!apiKey) {
    throw new Error('EMBEDDING_API_KEY is not set');
  }

  let response: Response;
  try {
    response = await fetch(`${EMBEDDING_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    });
  } catch {
    throw new Error('Embedding API request failed');
  }

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { data?: { embedding?: number[] }[] };
  const vector = data?.data?.[0]?.embedding;

  if (!Array.isArray(vector)) {
    throw new Error('Embedding API returned no vector');
  }

  return vector;
}