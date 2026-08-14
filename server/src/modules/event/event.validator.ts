import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid ObjectId" }
);

const createEventBody = z
  .object({
    organizationId: objectId,
    venueBookingId: objectId.optional(),
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