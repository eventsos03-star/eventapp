import mongoose, { Schema, type Types } from 'mongoose';

export interface IRegistration {
  eventId: Types.ObjectId;
  participantId: Types.ObjectId;
  teamId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    participantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  },
  { timestamps: true },
);

const Registration = mongoose.model<IRegistration>(
  'Registration',
  registrationSchema,
);

export default Registration;
