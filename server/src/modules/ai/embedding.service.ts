import { pipeline } from '@xenova/transformers';
import { env } from '../../config/env.js';

interface Embedder {
  (texts: string[], options: { pooling: 'mean'; normalize: boolean }): Promise<{
    tolist: () => Array<Float32Array>;
  }>;
}

let embedderPromise: Promise<Embedder> | null = null;

function getEmbedder(): Promise<Embedder> {
  if (!embedderPromise) {
    embedderPromise = pipeline('feature-extraction', env.AI_EMBED_MODEL) as Promise<Embedder>;
  }
  return embedderPromise;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await getEmbedder();
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  return output.tolist().map((row) => Array.from(row));
}

export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}