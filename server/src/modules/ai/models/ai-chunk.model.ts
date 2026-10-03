import mongoose, { Schema } from "mongoose";

export interface IAiChunk {
  content: string;
  source: string;
  section: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

const aiChunkSchema = new Schema<IAiChunk>(
  {
    content: { type: String, required: true },
    source: { type: String, required: true },
    section: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

const AiChunk = mongoose.model<IAiChunk>("AiChunk", aiChunkSchema);

export default AiChunk;