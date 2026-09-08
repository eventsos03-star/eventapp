import { AppError } from "../../utils/AppError.js";
import Event from "./event.model.js";
import type { CreateEventInput, UpdateEventInput } from "./event.model.js";

export async function createEvent(data: CreateEventInput, userId: string) {
  const event = await Event.create({
    ...data,
    createdBy: userId,
    status: "draft",
  });
  return event;
}

export async function publishEvent(eventId: string) {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError("Event not found", 404);
  }

  if (event.status === "published") {
    throw new AppError("Event already published", 409);
  }
  event.status = "published";
  await event.save();

  return event;
}

// --- Status auto-transition ---

function getTodayBoundsUTC() {
  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

  return { startOfToday, startOfTomorrow };
}

/**
 * Flips event statuses based on eventDate:
 * - published events happening today -> ongoing
 * - published/ongoing events whose date has passed -> completed
 * Drafts and cancelled events are left untouched.
 */
export async function syncEventStatuses(organizationId?: string) {
  const { startOfToday, startOfTomorrow } = getTodayBoundsUTC();
  const scope = organizationId ? { organizationId } : {};

  const [ongoingResult, correctedResult, completedResult] = await Promise.all([
    // published events happening today -> ongoing
    Event.updateMany(
      {
        ...scope,
        eventDate: { $gte: startOfToday, $lt: startOfTomorrow },
        status: "published",
        isDeleted: false,
      },
      { $set: { status: "ongoing" } }
    ),

    // self-heal: anything wrongly marked completed whose date is actually today -> ongoing
    Event.updateMany(
      {
        ...scope,
        eventDate: { $gte: startOfToday, $lt: startOfTomorrow },
        status: "completed",
        isDeleted: false,
      },
      { $set: { status: "ongoing" } }
    ),

    // published/ongoing events whose date has genuinely passed -> completed
    Event.updateMany(
      {
        ...scope,
        eventDate: { $lt: startOfToday },
        status: { $in: ["published", "ongoing"] },
        isDeleted: false,
      },
      { $set: { status: "completed" } }
    ),
  ]);

  return {
    ongoingCount: ongoingResult.modifiedCount + correctedResult.modifiedCount,
    completedCount: completedResult.modifiedCount,
  };
}

export async function getPublishedLists() {
  await syncEventStatuses();
  const event = await Event.find({ status: "published", isDeleted: false }).sort({
    eventDate: 1,
  });
  return event;
}

export async function getEventByOrganizationID(organizationId: string) {
  if (!organizationId) {
    throw new AppError("organizationId is required", 400);
  }

  await syncEventStatuses(organizationId);

  const event = await Event.find({
    organizationId,
    isDeleted: false,
  }).sort({ eventDate: 1 });

  return event;
}

export async function getalleventsforadmin() {
  await syncEventStatuses();

  const event = await Event.find({ isDeleted: false })
    .sort({ eventDate: 1 })
    .populate("organizationId", "organizationName")
    .populate("createdBy", "firstName lastName email");
  return event;
}

export async function getEventById(eventId: string) {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).sort({
    eventDate: 1,
  });

  if (event && event.status !== "cancelled" && event.status !== "draft") {
    const { startOfToday, startOfTomorrow } = getTodayBoundsUTC();
    const eventDate = new Date(event.eventDate);

    if (eventDate < startOfToday && event.status !== "completed") {
      event.status = "completed";
      await event.save();
    } else if (
      eventDate >= startOfToday &&
      eventDate < startOfTomorrow &&
      event.status === "published"
    ) {
      event.status = "ongoing";
      await event.save();
    }
  }

  return event;
}

export async function deleteEvent(eventId: string) {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError("Event not found", 404);
  }
  event.isDeleted = true;
  await event.save();
  return event;
}

export async function updateEvent(eventId: string, data: UpdateEventInput) {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) {
    throw new AppError("Event not found", 404);
  }

  Object.assign(event, data);
  await event.save();

  return event;
}