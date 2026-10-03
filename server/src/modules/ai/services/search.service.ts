import AiChunk from '../models/ai-chunk.model.js';
import { generateEmbedding } from './embedding.service.js';

export interface SearchResult {
  content: string;
  source: string;
  section: string;
  score: number;
}

const RESULTS_LIMIT = 5;

export async function searchKnowledge(question: string): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(question);

  const results = await AiChunk.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: embedding,
        numCandidates: 50,
        limit: RESULTS_LIMIT,
      },
    },
    {
      $project: {
        _id: 0,
        content: 1,
        source: 1,
        section: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ]);

  return results;
}