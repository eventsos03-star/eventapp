import mongoose, { Schema, type Types } from "mongoose";

export interface IVenueBookingLock {
  venueId: Types.ObjectId;
  locked: boolean;
  owner: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const venueBookingLockSchema = new Schema<IVenueBookingLock>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
      unique: true,
    },
    locked: { type: Boolean, required: true, default: true },
    owner: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

venueBookingLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VenueBookingLock =
  (mongoose.models.VenueBookingLock as mongoose.Model<IVenueBookingLock>) ??
  mongoose.model<IVenueBookingLock>(
    "VenueBookingLock",
    venueBookingLockSchema
  );

export default VenueBookingLock;
