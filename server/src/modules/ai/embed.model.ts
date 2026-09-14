import mongoose, { Schema } from 'mongoose';

export interface IAiEmbedding {
  contentType: string;
  source: string;
  section: string;
  contentHash: string;
  text: string;
  vector: number[];
  createdAt: Date;
  updatedAt: Date;
}

const aiEmbeddingSchema = new Schema<IAiEmbedding>(
  {
    contentType: { type: String, required: true, index: true },
    source: { type: String, required: true },
    section: { type: String, default: '' },
    contentHash: { type: String, required: true, index: true },
    text: { type: String, required: true },
    vector: { type: [Number], required: true },
  },
  { timestamps: true },
);

const AiEmbedding = (mongoose.models.AiEmbedding as mongoose.Model<IAiEmbedding>) ??
  mongoose.model<IAiEmbedding>('AiEmbedding', aiEmbeddingSchema);

export default AiEmbedding;