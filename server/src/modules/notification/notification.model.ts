import mongoose, { Schema, type Types } from 'mongoose';

export interface INotification {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'team' | 'organization' | 'venuBooking' | 'task' | 'General';
  referenceId?: Types.ObjectId;
  isRead: boolean;
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
      enum: ['team', 'organization', 'venuBooking', 'task', 'General'],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema,
);

export default Notification;
