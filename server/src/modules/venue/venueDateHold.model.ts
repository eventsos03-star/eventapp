import mongoose, { Schema, type Types } from "mongoose";

export interface IVenueDateHold {
  _id: Types.ObjectId;
  venueId: Types.ObjectId;
  userId: Types.ObjectId;

  startDate: Date;
  endDate: Date;

  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const venueDateHoldSchema = new Schema<IVenueDateHold>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

venueDateHoldSchema.index({
  venueId: 1,
  startDate: 1,
  endDate: 1,
});

venueDateHoldSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const VenueDateHold =
  mongoose.models.VenueDateHold as mongoose.Model<IVenueDateHold> ??
  mongoose.model<IVenueDateHold>(
    "VenueDateHold",
    venueDateHoldSchema
  );

export default VenueDateHold;
