import mongoose, { Schema, type Types } from 'mongoose';

export type OrganizationRole =
  | 'owner'
  | 'organizer'
  | 'finance_manager'
  | 'user_manager'
  | 'certificate_manager'
  | 'member';

export interface IOrganizationMember {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  inviteEmail?: string;
  role: OrganizationRole;
  inviteStatus: 'pending' | 'accepted' | 'rejected';
  invitedBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationMemberSchema = new Schema<IOrganizationMember>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inviteEmail: { type: String },
    role: {
      type: String,
      enum: ['owner', 'organizer', 'finance_manager', 'user_manager', 'certificate_manager', 'member'],
      required: true,
      default: 'member',
    },
    inviteStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

organizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
organizationMemberSchema.index({ organizationId: 1, isDeleted: 1 });

const OrganizationMember = mongoose.model<IOrganizationMember>(
  'OrganizationMember',
  organizationMemberSchema
);

export default OrganizationMember;