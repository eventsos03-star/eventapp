import mongoose, { Schema, type Types } from 'mongoose';

export interface IVenueImage {
  url: string;
  key: string;
}

export interface IVenueLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] — GeoJSON order
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
}

export interface IVenue {
  ownerId: Types.ObjectId;
  venueName: string;
  description: string;
  images: IVenueImage[];
  location: IVenueLocation;
  capacity: number;
  pricePerDay: number;
  bookingPaymentPolicy: 'fullpayment' | 'advanceAllowed' | 'payAfterEvent';
  advancePercentage?: number;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const venueLocationSchema = new Schema<IVenueLocation>(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(v: number[]) {
          return (
            Array.isArray(v) &&
            v.length === 2 &&
            v[0] >= -180 &&
            v[0] <= 180 &&
            v[1] >= -90 &&
            v[1] <= 90
          );
        },
        message: 'Coordinates must be [longitude, latitude] within valid ranges',
      },
    },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    formattedAddress: { type: String, default: '' },
  },
  { _id: false },
);

const venueSchema = new Schema<IVenue>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    venueName: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true },
      },
    ],
    location: { type: venueLocationSchema, required: true },
    capacity: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    bookingPaymentPolicy: {
      type: String,
      enum: ['fullpayment', 'advanceAllowed', 'payAfterEvent'],
      required: true,
    },
    advancePercentage: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'blocked'],
      default: 'pending',
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

venueSchema.index({ location: '2dsphere' });
venueSchema.index({ status: 1, isDeleted: 1 });
venueSchema.index({ ownerId: 1 });

const Venue = mongoose.model<IVenue>('Venue', venueSchema);

export default Venue;
