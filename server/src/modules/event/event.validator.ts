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
     *  This unlocks same-day registration windows for last-minute / sudden events. */
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
  // When eventTime is supplied the event has a precise start time, so
  // registrationEndDate is allowed to be up to the event start time.
  .refine(
    (data) => {
      const regEnd = data.registrationEndDate;
      const evStart = getEffectiveEventStart(data.eventDate, data.eventTime);
      return regEnd <= evStart;
    },
    { message: "registrationEndDate must be before or on event start time", path: ["registrationEndDate"] }
  )
  .refine(
    (data) => {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (data.eventTime) {
        const evStart = getEffectiveEventStart(data.eventDate, data.eventTime);
        return evStart >= fifteenMinutesAgo;
      }
      // Without eventTime, allow today's date (with 24h timezone buffer)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return data.eventDate >= yesterday;
    },
    { message: "eventDate cannot be in the past", path: ["eventDate"] }
  )
  .refine(
    (data) => !data.eventEndDate || data.eventEndDate >= data.eventDate,
    { message: "eventEndDate must be on or after eventDate", path: ["eventEndDate"] }
  )
  // Allow registrationStartDate from now (current moment), with 15 minutes grace period
  .refine(
    (data) => {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      return data.registrationStartDate >= fifteenMinutesAgo;
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
      const evStart = getEffectiveEventStart(data.eventDate, data.eventTime);
      return data.registrationEndDate <= evStart;
    },
    { message: "registrationEndDate must be before or on event start time", path: ["registrationEndDate"] }
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
