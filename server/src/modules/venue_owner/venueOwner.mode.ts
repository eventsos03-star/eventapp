import mongoose, { Schema, Types } from 'mongoose';

export interface IVenueOwner {
  userId: Types.ObjectId;
  ownerName: string;
  phone: string;
  alternativePhone: string;
  email: string;
  address: string;
  managerName: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  rejectionReason?: string;
   isOwnerDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const venueOwnerSchema = new Schema<IVenueOwner>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    alternativePhone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    managerName: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'blocked'],
      default: 'pending',
      required: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },
    isOwnerDeleted: {
  type: Boolean,
  default: false,
  required: true,
},

   
  },
  {
    timestamps: true,
  },
);



const VenueOwner = mongoose.model<IVenueOwner>(
  'VenueOwner',
  venueOwnerSchema,
);

export default VenueOwner;