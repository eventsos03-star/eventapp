import mongoose, { Schema, type Types } from 'mongoose';

export interface ISession {
  user: Types.ObjectId;
  refreshToken: string;
  browser: string;
  ip: string;
  userAgent: string;
  expiresAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // SHA-256 hash of the refresh token, never stored in plain text.
    refreshToken: { type: String, required: true },
    browser: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);


sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ refreshToken: 1 });

const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;
