import mongoose, { Schema, type Types } from 'mongoose';

export interface ICertificate {
  registrationId: Types.ObjectId;
  certificateNumber: string;
  certificateUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      unique: true,
    },
    certificateNumber: { type: String, required: true, unique: true },
    certificateUrl: { type: String, required: true },
  },
  { timestamps: true },
);

const Certificate = mongoose.model<ICertificate>(
  'Certificate',
  certificateSchema,
);

export default Certificate;
