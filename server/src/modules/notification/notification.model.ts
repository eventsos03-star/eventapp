import mongoose, { Schema, type Types } from 'mongoose';

export interface INotification {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type:
    | 'venueBooking'
    | 'venueOwner'
    | 'venue'
    | 'organization'
    | 'task'
    | 'team'
    | 'general';
  referenceId?: Types.ObjectId;
  link?: string;
  meta?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['venueBooking', 'venueOwner', 'venue', 'organization', 'task', 'team', 'general'],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId },
    link: { type: String },
    meta: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;