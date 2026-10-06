import { AppError } from "../../utils/AppError.js";
import Event from "./event.model.js";
import type { CreateEventInput, UpdateEventInput } from "./event.model.js";
import * as bookingService from "../venue/booking/booking.service.js";
import VenueBooking from "../venue/venueBooking.model.js";
import Registration from "./registration.model.js";
import Attendance from "./attendance.model.js";
import Ticket from "./ticket.model.js";

export async function createEvent(
  data: CreateEventInput,
  userId: string
) {
  const {
    venueId,
    organizationId,
    eventDate,
    eventEndDate,
    ...eventData
  } = data;

  // Create venue booking request (multi-day events reserve the whole range).
  const booking = await bookingService.createBooking({
    userId,
    organizationId,
    venueId,
    startDate: eventDate,
    endDate: eventEndDate ?? eventDate,
  });

  // Create event as draft with pre-generated _id if supplied
  const event = await Event.create({
    ...eventData,
    ...(data._id ? { _id: data._id } : {}),
    organizationId,
    eventDate,
    eventEndDate,
    createdBy: userId,
    venueBookingId: booking._id,
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

  // Publish gate: an event can only go live once its venue booking has been approved
  if (event.venueBookingId) {
    const booking = await VenueBooking.findById(event.venueBookingId).select("status");
    if (!booking || booking.status !== "approved") {
      throw new AppError(
        "This event cannot be published until its venue booking is approved",
        400,
      );
    }
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
 * - future dates -> published
 * - happening today -> ongoing
 * - past dates -> completed
 * Drafts and cancelled events are untouched.
 */
export async function syncEventStatuses(organizationId?: string) {
  const { startOfToday, startOfTomorrow } = getTodayBoundsUTC();
  const scope = organizationId ? { organizationId } : {};

  const [ongoingResult, correctedResult, completedResult, revertedResult] = await Promise.all([
    // 1. Published events happening today -> ongoing
    Event.updateMany(
      {
        ...scope,
        eventDate: { $gte: startOfToday, $lt: startOfTomorrow },
        status: "published",
        isDeleted: false,
      },
      { $set: { status: "ongoing" } }
    ),

    // 2. Self-heal: anything wrongly marked completed whose date is actually today -> ongoing
    Event.updateMany(
      {
        ...scope,
        eventDate: { $gte: startOfToday, $lt: startOfTomorrow },
        status: "completed",
        isDeleted: false,
      },
      { $set: { status: "ongoing" } }
    ),

    // 3. Published/ongoing events whose date has genuinely passed -> completed
    Event.updateMany(
      {
        ...scope,
        eventDate: { $lt: startOfToday },
        status: { $in: ["published", "ongoing"] },
        isDeleted: false,
      },
      { $set: { status: "completed" } }
    ),

    // 4. FIX: If event date was edited to a future date -> revert ongoing/completed back to published!
    Event.updateMany(
      {
        ...scope,
        eventDate: { $gte: startOfTomorrow },
        status: { $in: ["ongoing", "completed"] },
        isDeleted: false,
      },
      { $set: { status: "published" } }
    ),
  ]);

  return {
    ongoingCount: ongoingResult.modifiedCount + correctedResult.modifiedCount,
    completedCount: completedResult.modifiedCount,
    revertedCount: revertedResult.modifiedCount,
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

  // Syncs statuses before returning the dashboard list
  await syncEventStatuses(organizationId);

  const event = await Event.find({
    organizationId,
    isDeleted: false,
  })
    .populate({
      path: "venueBookingId",
      populate: {
        path: "venueId",
        select: "venueName location capacity images pricePerDay bookingPaymentPolicy",
      },
    })
    .sort({ eventDate: 1 });

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
  const event = await Event.findOne({ _id: eventId, isDeleted: false })
    .populate({
      path: "venueBookingId",
      populate: {
        path: "venueId",
      },
    })
    .sort({
      eventDate: 1,
    });

  if (event && event.status !== "cancelled" && event.status !== "draft") {
    const { startOfToday, startOfTomorrow } = getTodayBoundsUTC();
    const eventDate = new Date(event.eventDate);

    // If rescheduled to future -> published
    if (eventDate >= startOfTomorrow && event.status !== "published") {
      event.status = "published";
      await event.save();
    } else if (eventDate < startOfToday && event.status !== "completed") {
      event.status = "completed";
      await event.save();
    } else if (
      eventDate >= startOfToday &&
      eventDate < startOfTomorrow &&
      event.status !== "ongoing"
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

  if (event.venueBookingId) {
    await VenueBooking.updateOne(
      { _id: event.venueBookingId, status: { $in: ["pending", "approved"] } },
      { $set: { status: "cancelled" } }
    );
  }

  return event;
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function updateEvent(eventId: string, data: UpdateEventInput) {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) {
    throw new AppError("Event not found", 404);
  }

  const nextStart = data.eventDate ? new Date(data.eventDate) : event.eventDate;
  const nextEnd = data.eventEndDate
    ? new Date(data.eventEndDate)
    : event.eventEndDate ?? event.eventDate;

  if (nextEnd < nextStart) {
    throw new AppError("eventEndDate must be on or after eventDate", 400);
  }

  const rangeChanged =
    !isSameCalendarDay(event.eventDate, nextStart) ||
    !isSameCalendarDay(event.eventEndDate ?? event.eventDate, nextEnd);

  if (rangeChanged && event.venueBookingId) {
    const booking = await VenueBooking.findById(event.venueBookingId).select(
      "venueId status"
    );
    if (
      booking &&
      booking.status !== "cancelled" &&
      booking.status !== "rejected"
    ) {
      const conflict = await bookingService.hasOverlap(
        booking.venueId.toString(),
        nextStart,
        nextEnd,
        event.venueBookingId.toString(),
        ["approved", "pending"]
      );
      if (conflict) {
        throw new AppError(
          "This venue is already booked for the selected date",
          409
        );
      }
    }
  }

  Object.assign(event, data);

  // Automatically recalculate status based on the new date
  if (event.status !== "draft" && event.status !== "cancelled") {
    const { startOfToday, startOfTomorrow } = getTodayBoundsUTC();
    if (nextStart >= startOfTomorrow) {
      event.status = "published";
    } else if (nextStart >= startOfToday && nextStart < startOfTomorrow) {
      event.status = "ongoing";
    } else if (nextStart < startOfToday) {
      event.status = "completed";
    }
  }

  await event.save();

  if (rangeChanged && event.venueBookingId) {
    await VenueBooking.updateOne(
      { _id: event.venueBookingId, status: { $in: ["pending", "approved"] } },
      { $set: { startDate: nextStart, endDate: nextEnd } }
    );
  }

  return event;
}

export async function getEventParticipants(eventId: string) {
  const registrations = await Registration.find({ eventId })
    .populate("participantId", "firstName lastName email")
    .populate("teamId", "teamName teamCode members")
    .sort({ createdAt: -1 });

  const attendances = await Attendance.find({ eventId });

  const attendanceByRegId = new Map<string, any[]>();
  for (const att of attendances) {
    const regKey = att.registrationId.toString();
    if (!attendanceByRegId.has(regKey)) {
      attendanceByRegId.set(regKey, []);
    }
    attendanceByRegId.get(regKey)!.push(att);
  }

  return registrations.map((reg: any) => {
    const regObj = reg.toObject();
    const regAttendances = attendanceByRegId.get(reg._id.toString()) || [];

    const isCheckedIn = Boolean(reg.checkedIn || regAttendances.length > 0);
    const checkedInAt = reg.checkedInAt || regAttendances[0]?.checkedInAt || null;

    return {
      ...regObj,
      checkedIn: isCheckedIn,
      checkedInAt,
      attendedCount: regAttendances.length,
      totalTeamMembers: regObj.teamId?.members?.length || 1,
    };
  });
}

export async function toggleParticipantCheckIn(registrationId: string) {
  const reg: any = await Registration.findById(registrationId);
  if (!reg) throw new AppError("Registration not found", 404);

  reg.checkedIn = !reg.checkedIn;
  reg.checkedInAt = reg.checkedIn ? new Date() : null;
  await reg.save();

  if (reg.checkedIn) {
    const existing = await Attendance.findOne({ registrationId: reg._id });
    if (!existing) {
      const ticket = await Ticket.findOne({ registrationId: reg._id });
      await Attendance.create({
        eventId: reg.eventId,
        registrationId: reg._id,
        ticketId: ticket?._id ?? reg._id,
        userId: reg.participantId,
        checkedInAt: new Date(),
        checkedInBy: reg.participantId,
      });
    }
  } else {
    await Attendance.deleteMany({ registrationId: reg._id });
  }

  return reg;
}