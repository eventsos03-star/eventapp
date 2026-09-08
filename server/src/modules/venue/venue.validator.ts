import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource id');

const locationSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
    .describe('Coordinates must be [longitude, latitude]'),
  address: z.string().max(500).default(''),
  city: z.string().max(200).default(''),
  state: z.string().max(200).default(''),
  country: z.string().max(200).default(''),
  postalCode: z.string().max(20).default(''),
  formattedAddress: z.string().max(1000).default(''),
});

const imageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  publicId: z.string().min(1, 'Image publicId is required'),
});

export const createVenueSchema = z.object({
  body: z.object({
    venueName: z.string().min(1, 'Venue name is required').max(200),
    description: z.string().min(1, 'Description is required').max(5000),
    images: z.array(imageSchema).max(10).default([]),
    location: locationSchema,
    capacity: z.number().int().min(1, 'Capacity must be at least 1'),
    pricePerDay: z.number().min(0, 'Price must be non-negative'),
    bookingPaymentPolicy: z.enum([
      'fullpayment',
      'advanceAllowed',
      'payAfterEvent',
    ]),
    advancePercentage: z.number().min(1).max(100).optional(),
  }),
});

export const updateVenueSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    venueName: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(5000).optional(),
    images: z.array(imageSchema).max(10).optional(),
    location: locationSchema.partial().optional(),
    capacity: z.number().int().min(1).optional(),
    pricePerDay: z.number().min(0).optional(),
    bookingPaymentPolicy: z
      .enum(['fullpayment', 'advanceAllowed', 'payAfterEvent'])
      .optional(),
    advancePercentage: z.number().min(1).max(100).optional(),
  }),
});

export const venueIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const listVenuesQuerySchema = z.object({
  query: z.object({
    city: z.string().optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().min(100).max(500000).default(25000),
    minCapacity: z.coerce.number().int().min(1).optional(),
    maxCapacity: z.coerce.number().int().min(1).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const geocodeQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required').max(500),
  }),
});

export const reverseGeocodeQuerySchema = z.object({
  query: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
});
