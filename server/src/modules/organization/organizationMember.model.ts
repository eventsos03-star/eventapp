import mongoose, { Schema, type Types } from 'mongoose';

export interface IOrganizationMember {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  inviteEmail?: string;
  role: 'owner' | 'organizer' | 'member';
  inviteStatus: 'pending' | 'accepted' | 'rejected';
  invitedBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationMemberSchema = new Schema<IOrganizationMember>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inviteEmail: { type: String },
    role: {
      type: String,
      enum: ['owner', 'organizer', 'member'],
      required: true,
    },
    inviteStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

organizationMemberSchema.index(
  { organizationId: 1, userId: 1 },
  { unique: true },
);
organizationMemberSchema.index({ organizationId: 1, isDeleted: 1 });

const OrganizationMember = mongoose.model<IOrganizationMember>(
  'OrganizationMember',
  organizationMemberSchema,
);

export default OrganizationMember;
