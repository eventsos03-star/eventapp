import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const INDEX_NAME = 'vector_index';

type SearchIndexDoc = { name: string; status?: string };

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
dotenv.config({ path: envPath });

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in server/.env');
  }

  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection has no database');
  }

  const collection = db.collection('aichunks');

  const existing: SearchIndexDoc[] = await collection.listSearchIndexes().toArray();
  if (existing.some((idx) => idx.name === INDEX_NAME)) {
    console.log(`Index "${INDEX_NAME}" already exists.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  await collection.createSearchIndex({
    name: INDEX_NAME,
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 768,
          similarity: 'cosine',
        },
      ],
    },
  });
  console.log(`Creating index "${INDEX_NAME}"...`);

  for (let i = 0; i < 30; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const indexes: SearchIndexDoc[] = await collection.listSearchIndexes().toArray();
    const index = indexes.find((idx) => idx.name === INDEX_NAME);
    if (!index) continue;
    const status = index.status;
    console.log(`status: ${status}`);
    if (status === 'READY') {
      await mongoose.disconnect();
      process.exit(0);
    }
    if (status === 'FAILED') {
      console.error(JSON.stringify(index, null, 2));
      throw new Error('Index creation failed');
    }
  }

  console.log('Timed out waiting for index to become ready.');
  await mongoose.disconnect();
  process.exit(1);
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});