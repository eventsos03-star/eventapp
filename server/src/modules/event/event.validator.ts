import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: "Invalid ObjectId" }
);

function getEffectiveEventStart(eventDate: Date, eventTime?: string | null): Date {
  if (eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime)) {
    const [hours, minutes] = eventTime.split(":").map(Number);
    const d = new Date(eventDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }
  return eventDate;
}

const createEventBody = z
  .object({
    organizationId: objectId,
    venueId: objectId,
    eventName: z.string().trim().min(3).max(120),
    description: z.string().trim().min(3),
    bannerImage: z
      .object({
        url: z.string().url(),
        publicId: z.string().optional(),
        key: z.string().optional(),
      })
      .optional(),
    eventType: z.enum(["free", "paid"]),
    registrationType: z.enum(["team", "individual"]),
    maxParticipants: z.number().int().positive(),
    registrationStartDate: z.coerce.date(),
    registrationEndDate: z.coerce.date(),
    eventDate: z.coerce.date(),
    eventEndDate: z.coerce.date().optional(),
    /** HH:mm — when provided the event has a specific wall-clock start time.
     *  This unlocks same-day / instant registration windows for last-minute events. */
    eventTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "eventTime must be HH:mm").optional(),
    certificateEnabled: z.boolean().optional(),
    ticketPrice: z.number().positive().optional(),
    teamSize: z.number().int().min(2, "teamSize must be at least 2").optional(),
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
  // For instant and regular events, registration can remain open up until the event concludes
  .refine(
    (data) => {
      const regEnd = data.registrationEndDate;
      const endDay = data.eventEndDate ?? data.eventDate;
      // Allow registration to remain open until the end of the event day / multi-day window
      const eventEndBoundary = new Date(endDay.getTime() + 24 * 60 * 60 * 1000);
      return regEnd <= eventEndBoundary;
    },
    { message: "registrationEndDate must be on or before the event ends", path: ["registrationEndDate"] }
  )
  .refine(
    (data) => {
      // Allow instant events starting today or any future date (24h buffer for timezones)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return data.eventDate >= yesterday;
    },
    { message: "eventDate cannot be in the past", path: ["eventDate"] }
  )
  .refine(
    (data) => !data.eventEndDate || data.eventEndDate >= data.eventDate,
    { message: "eventEndDate must be on or after eventDate", path: ["eventEndDate"] }
  )
  // Allow registrationStartDate from today / now (with 24h grace buffer for timezones)
  .refine(
    (data) => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return data.registrationStartDate >= yesterday;
    },
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
        publicId: z.string().optional(),
        key: z.string().optional(),
      })
      .nullable()
      .optional(),
    removeBannerImage: z.boolean().optional(),
    eventType: z.enum(["free", "paid"]).optional(),
    registrationType: z.enum(["team", "individual"]).optional(),
    maxParticipants: z.number().int().positive().optional(),
    registrationStartDate: z.coerce.date().optional(),
    registrationEndDate: z.coerce.date().optional(),
    eventDate: z.coerce.date().optional(),
    eventEndDate: z.coerce.date().nullable().optional(),
    removeEventEndDate: z.boolean().optional(),
    /** HH:mm — when provided the event has a specific wall-clock start time.
     *  This unlocks same-day registration windows for last-minute / sudden events. */
    eventTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "eventTime must be HH:mm").nullable().optional(),
    certificateEnabled: z.boolean().optional(),
    ticketPrice: z.number().positive().nullable().optional(),
    teamSize: z.number().int().min(2, "teamSize must be at least 2").nullable().optional(),
  })
  .strict()
  .refine(
    (data) => !data.registrationStartDate || !data.registrationEndDate ||
      data.registrationStartDate < data.registrationEndDate,
    { message: "registrationStartDate must be before registrationEndDate", path: ["registrationStartDate"] }
  )
  .refine(
    (data) => {
      if (!data.registrationEndDate || !data.eventDate) return true;
      const endDay = data.eventEndDate ?? data.eventDate;
      const eventEndBoundary = new Date(endDay.getTime() + 24 * 60 * 60 * 1000);
      return data.registrationEndDate <= eventEndBoundary;
    },
    { message: "registrationEndDate must be on or before the event ends", path: ["registrationEndDate"] }
  )
  .refine(
    (data) => !data.eventEndDate || !data.eventDate ||
      data.eventEndDate >= data.eventDate,
    { message: "eventEndDate must be on or after eventDate", path: ["eventEndDate"] }
  )
  .refine(
    (data) => data.eventType !== "paid" || data.ticketPrice === undefined || (data.ticketPrice !== null && data.ticketPrice > 0),
    { message: "ticketPrice must be positive for paid events", path: ["ticketPrice"] }
  )
  .refine(
    (data) => data.registrationType !== "team" || data.teamSize === undefined || (data.teamSize !== null && data.teamSize >= 2),
    { message: "teamSize must be at least 2 for team registration", path: ["teamSize"] }
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
  eventType: z.enum(["free", "paid"]).optional(),
  sort: z.enum(["upcoming", "latest", "price-low", "price-high"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});
