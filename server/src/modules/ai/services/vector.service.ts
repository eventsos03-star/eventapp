import AiChunk from "../models/ai-chunk.model.js";
import type { DocumentChunk } from "./chunk.service.js";

export async function chunkExists(chunk: DocumentChunk): Promise<boolean> {
  const existing = await AiChunk.findOne({
    source: chunk.source,
    section: chunk.section,
    content: chunk.content,
  }).select("_id");

  return existing !== null;
}

export async function saveChunk(chunk: DocumentChunk, embedding: number[]): Promise<boolean> {
  const result = await AiChunk.updateOne(
    { source: chunk.source, section: chunk.section, content: chunk.content },
    { $setOnInsert: { ...chunk, embedding } },
    { upsert: true }
  );

  return result.upsertedCount > 0;
}