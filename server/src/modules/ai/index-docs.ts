import { readFile } from 'node:fs/promises';
import path from "node:path"
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDB } from '../../config/db.js';
import { chunkMarkdown } from './docs-chunker.js';
import { upsertChunks, countEmbeddings, clearIndex } from './embed.store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/src/modules/ai => repo root is 4 levels up
const REPO_ROOT = path.resolve(__dirname, '../../../../');

const CONTENT_TYPE = 'docs';

async function loadFile(relPath: string): Promise<string> {
  try {
    return await readFile(path.join(REPO_ROOT, relPath), 'utf8');
  } catch {
    return '';
  }
}
async function main(): Promise<void> {
  await connectDB();

  const sources: Array<{ source: string; content: string }> = [
    { source: 'docs/assistant-knowledge.md', content: await loadFile('docs/assistant-knowledge.md') },
  ];
   const loaded = sources.filter((s) => s.content.length > 0);
  const chunks = loaded.flatMap(({ source, content }) => chunkMarkdown(source, content));

  console.log(`Found ${chunks.length} chunks from ${loaded.length} source file(s).`);
  if (chunks.length === 0) {
    console.log('Nothing to index.');
    return;
  }

  const cleared = await clearIndex(CONTENT_TYPE);
  console.log(`Cleared ${cleared} existing embedding(s) from '${CONTENT_TYPE}'.`);

  const added = await upsertChunks(CONTENT_TYPE, chunks, true);
  const total = await countEmbeddings(CONTENT_TYPE);

  console.log(`\nIndex complete: ${added} new embedding(s), ${total} total in '${CONTENT_TYPE}'.`);
  console.log('Remember to (re)create the Atlas Vector Search index on ai_embeddings.vector if this is the first run.');
}
main()
  .catch((err) => {
    console.error('Indexing failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });