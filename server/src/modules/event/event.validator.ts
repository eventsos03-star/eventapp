import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid ObjectId" }
);

const createEventBody = z
  .object({
    organizationId: objectId,
    venueId: objectId,
    eventName: z.string().trim().min(3).max(120),
    description: z.string().trim().min(3),
    bannerImage: z
      .object({
        url: z.string().url(),
        publicId: z.string(),
      })
      .optional(),
    eventType: z.enum(["free", "paid"]),
    registrationType: z.enum(["team", "individual"]),
    maxParticipants: z.number().int().positive(),
    registrationStartDate: z.coerce.date(),
    registrationEndDate: z.coerce.date(),
    eventDate: z.coerce.date(),
    eventEndDate: z.coerce.date().optional(),
    certificateEnabled: z.boolean().optional(),
    ticketPrice: z.number().positive().optional(),
    teamSize: z.number().int().positive().optional(),
  })
  .refine(
    (data) => data.eventType !== "paid" || typeof data.ticketPrice === "number",
    { message: "ticketPrice is required for paid events", path: ["ticketPrice"] }
  )
  .refine(
    (data) => data.registrationType !== "team" || typeof data.teamSize === "number",
    { message: "teamSize is required for team registration", path: ["teamSize"] }
  )
  .refine(
    (data) => data.registrationStartDate < data.registrationEndDate,
    { message: "registrationStartDate must be before registrationEndDate", path: ["registrationStartDate"] }
  )
  .refine(
    (data) => data.registrationEndDate <= data.eventDate,
    { message: "registrationEndDate must be before or on eventDate", path: ["registrationEndDate"] }
  ).refine(
    (data) => data.eventDate >= new Date(new Date().toDateString()),
    { message: "eventDate cannot be in the past", path: ["eventDate"] }
  )
  .refine(
    (data) => !data.eventEndDate || data.eventEndDate >= data.eventDate,
    { message: "eventEndDate must be on or after eventDate", path: ["eventEndDate"] }
  )
  .refine(
    (data) => data.registrationStartDate >= new Date(new Date().toDateString()),
    { message: "registrationStartDate cannot be in the past", path: ["registrationStartDate"] }
  );

export const createEventSchema = z.object({
  body: createEventBody,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const publishEventSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: objectId,
  }),
});


const updateEventBody = z
  .object({
    eventName: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(3).optional(),
    bannerImage: z
      .object({
        url: z.string().url(),
        publicId: z.string(),
      })
      .optional(),
    eventType: z.enum(["free", "paid"]).optional(),
    registrationType: z.enum(["team", "individual"]).optional(),
    maxParticipants: z.number().int().positive().optional(),
    registrationStartDate: z.coerce.date().optional(),
    registrationEndDate: z.coerce.date().optional(),
    eventDate: z.coerce.date().optional(),
    eventEndDate: z.coerce.date().optional(),
    certificateEnabled: z.boolean().optional(),
    ticketPrice: z.number().positive().optional(),
    teamSize: z.number().int().positive().optional(),
  })
  .strict() // rejects unknown keys outright — status/organizationId/isDeleted included
  .refine(
    (data) => !data.registrationStartDate || !data.registrationEndDate ||
      data.registrationStartDate < data.registrationEndDate,
    { message: "registrationStartDate must be before registrationEndDate", path: ["registrationStartDate"] }
  )
  .refine(
    (data) => !data.registrationEndDate || !data.eventDate ||
      data.registrationEndDate <= data.eventDate,
    { message: "registrationEndDate must be before or on eventDate", path: ["registrationEndDate"] }
  )
  .refine(
    (data) => !data.eventEndDate || !data.eventDate ||
      data.eventEndDate >= data.eventDate,
    { message: "eventEndDate must be on or after eventDate", path: ["eventEndDate"] }
  );

export const updateEventSchema = z.object({
  body: updateEventBody,
  query: z.object({}).optional(),
  params: z.object({
    id: objectId,
  }),
});

export const publicEventQueryValidator = z.object({
  search: z.string().optional(),
  location: z.string().optional(),

  eventType: z
    .enum(["free", "paid"])
    .optional(),

  sort: z
    .enum(["upcoming", "latest", "price-low", "price-high"])
    .optional(),

  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

