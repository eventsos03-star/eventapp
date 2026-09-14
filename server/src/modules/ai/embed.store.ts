import { createHash } from 'node:crypto';
import AiEmbedding from './embed.model.js';
import { embedTexts } from './embedding.service.js';


export interface AiChunk {
  source: string;
  section: string;
  text: string;
}
export function contentHash(text: string): string {
  return createHash('sha1').update(text).digest('hex');
}
export async function upsertChunk(contentType: string, chunk: AiChunk): Promise<boolean> {
  const hash = contentHash(chunk.text);
  const exists = await AiEmbedding.exists({ contentHash: hash });
  if (exists) return false;
  const [vector] = await embedTexts([chunk.text]);
   await AiEmbedding.create({
    contentType,
    source: chunk.source,
    section: chunk.section,
    contentHash: hash,
    text: chunk.text,
    vector,
  });
  return true;
}
export async function upsertChunks(contentType: string, chunks: AiChunk[], log = false): Promise<number> {
  let added = 0;
  for (const chunk of chunks) {
    const ok = await upsertChunk(contentType, chunk);
    if (ok) added += 1;
    if (log) console.log(`  [${chunk.source} / ${chunk.section}] ${ok ? 'embedded' : 'skipped (exists)'}`);
  }
  return added;
}

export async function clearIndex(contentType: string): Promise<number> {
  const { deletedCount } = await AiEmbedding.deleteMany({ contentType });
  return deletedCount ?? 0;
}

export async function countEmbeddings(contentType: string): Promise<number> {
  return AiEmbedding.countDocuments({ contentType });
}

