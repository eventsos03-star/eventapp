import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDB } from '../../config/db.js';
import { chunkMarkdown } from './services/chunk.service.js';
import { generateEmbedding } from './services/embedding.service.js';
import { saveChunk, chunkExists } from './services/vector.service.js';

const knowledgeDir = fileURLToPath(new URL('./knowledge', import.meta.url));

async function indexKnowledge(): Promise<void> {
  await connectDB();

  console.log('Indexing knowledge...');

  const files = readdirSync(knowledgeDir).filter((file) => file.endsWith('.md'));

  let totalSaved = 0;
  let totalChunks = 0;

  for (const file of files) {
    const markdown = readFileSync(`${knowledgeDir}/${file}`, 'utf8');
    const chunks = chunkMarkdown(markdown, file);

    let fileSaved = 0;

    for (const chunk of chunks) {
      const alreadySaved = await chunkExists(chunk);
      if (!alreadySaved) {
        const embedding = await generateEmbedding(chunk.content);
        const inserted = await saveChunk(chunk, embedding);
        if (inserted) fileSaved += 1;
      }
    }

    totalChunks += chunks.length;
    totalSaved += fileSaved;

    console.log(`${file}`);
    console.log(`  chunks: ${chunks.length}`);
    console.log(`  saved: ${fileSaved}`);
  }

  console.log(`\nKnowledge indexing completed. ${totalSaved}/${totalChunks} chunks saved.`);

  await mongoose.disconnect();
  process.exit(0);
}

indexKnowledge().catch(async (error) => {
  console.error('Knowledge indexing failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});