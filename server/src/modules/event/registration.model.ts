import mongoose, { Schema, type Types } from "mongoose";

export interface IRegistration {
  eventId: Types.ObjectId;
  participantId: Types.ObjectId;
  teamId?: Types.ObjectId;
  phoneNumber: string;
  collegeOrOrganization?: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    participantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    phoneNumber: {
      type: String,
      required: true,
    },
    collegeOrOrganization: {
      type: String,
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
  },
  { timestamps: true }
);

registrationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

const Registration = mongoose.model<IRegistration>(
  "Registration",
  registrationSchema
);

export default Registration;