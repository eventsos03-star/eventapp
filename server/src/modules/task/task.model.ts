import mongoose, { Schema, type Types } from 'mongoose';

export interface ITask {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  eventId?: Types.ObjectId;
  title: string;
  description?: string;
  assignedMemberId: Types.ObjectId;
  createdByUserId: Types.ObjectId;
  priority: 'low' | 'medium' | 'high';
  status: 'Todo' | 'InProgress' | 'Done';
  dueDate: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assignedMemberId: { type: Schema.Types.ObjectId, ref: 'OrganizationMember', required: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', required: true },
    status: { type: String, enum: ['Todo', 'InProgress', 'Done'], default: 'Todo', required: true },
    dueDate: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

taskSchema.index({ organizationId: 1, status: 1 });
taskSchema.index({ assignedMemberId: 1, status: 1 });

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;