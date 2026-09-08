import mongoose, { Schema, type Types } from 'mongoose';

export interface IOrganizationAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrganization {
  organizationName: string;
  organizationType: string;
  description: string;
  logo?: string;
  email: string;
  phoneNumber?: string;
  address: IOrganizationAddress;
  ownerId: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    organizationName: { type: String, required: true, trim: true },
    organizationType: {
      type: String,
      required: true,
      enum: ['college', 'company', 'startup', 'ngo', 'community', 'event_org', 'other'],
    },
    description: { type: String, default: '' },
    logo: { type: String },
    email: { type: String, required: true, lowercase: true, trim: true },
    phoneNumber: { type: String },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'blocked'],
      default: 'pending',
    },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ status: 1 });

const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);

export default Organization;
