import { AppError } from "../../utils/AppError.js";
import Event from "./event.model.js";
import type { CreateEventInput, UpdateEventInput } from "./event.model.js";
import * as bookingService from "../venue/booking/booking.service.js";
import VenueBooking from "../venue/venueBooking.model.js";
import Venue from "../venue/venue.model.js";
import Registration from "./registration.model.js";
import { withVenueLock } from "../../utils/mongoLock.js";
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

  // Validate maxParticipants against venue capacity
  const venue = await Venue.findById(venueId).select("capacity");
  if (venue && data.maxParticipants > venue.capacity) {
    throw new AppError(
      `Max participants cannot exceed venue capacity (${venue.capacity})`,
      400
    );
  }

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

// Status windows are computed from the stored instants (the client sends each
// day as local midnight), so one calendar day = 24h after the stored instant.
// This avoids UTC-day comparisons misfiring for timezones ahead of UTC.
const DAY_MS = 24 * 60 * 60 * 1000;

/** nextStatus: published = not started yet, ongoing = started, completed = window over. */
function nextStatusFor(
  now: Date,
  eventDate: Date,
  eventEndDate: Date | null | undefined
): "published" | "ongoing" | "completed" {
  const endAt = new Date((eventEndDate ?? eventDate).getTime() + DAY_MS);
  if (now >= endAt) return "completed";
  if (now >= eventDate) return "ongoing";
  return "published";
}

/**
 * Flips event statuses based on eventDate/eventEndDate vs now:
 * - not started yet -> published
 * - started, window not over -> ongoing
 * - window over -> completed
 * Drafts and cancelled events are untouched.
 */
export async function syncEventStatuses(organizationId?: string) {
  const now = new Date();
  const windowOverSince = new Date(now.getTime() - DAY_MS);
  const scope = organizationId ? { organizationId } : {};

  // Window has started (eventDate passed) but is not over yet.
  const windowOpen = {
    eventDate: { $lte: now },
    $or: [
      { eventEndDate: { $in: [null] }, eventDate: { $gt: windowOverSince } },
      { eventEndDate: { $gt: windowOverSince } },
    ],
  };

  // Window has genuinely passed.
  const windowOver = {
    $or: [
      { eventEndDate: { $in: [null] }, eventDate: { $lte: windowOverSince } },
      { eventEndDate: { $lte: windowOverSince } },
    ],
  };

  const [ongoingResult, correctedResult, completedResult, revertedResult] = await Promise.all([
    // 1. Published events whose window has started (but is not over) -> ongoing
    Event.updateMany(
      {
        ...scope,
        status: "published",
        ...windowOpen,
        isDeleted: false,
      },
      { $set: { status: "ongoing" } }
    ),

    // 2. Self-heal: anything wrongly marked completed whose window is still open -> ongoing
    Event.updateMany(
      {
        ...scope,
        status: "completed",
        ...windowOpen,
        isDeleted: false,
      },
      { $set: { status: "ongoing" } }
    ),

    // 3. Events whose window has genuinely passed -> completed
    Event.updateMany(
      {
        ...scope,
        status: { $in: ["published", "ongoing"] },
        ...windowOver,
        isDeleted: false,
      },
      { $set: { status: "completed" } }
    ),

    // 4. If event date was edited to a future date -> revert ongoing/completed back to published!
    Event.updateMany(
      {
        ...scope,
        status: { $in: ["ongoing", "completed"] },
        eventDate: { $gt: now },
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
    const desired = nextStatusFor(
      new Date(),
      new Date(event.eventDate),
      event.eventEndDate ? new Date(event.eventEndDate) : undefined
    );
    if (event.status !== desired) {
      event.status = desired;
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
    const venueBookingId = event.venueBookingId;
    const setCancelled = () =>
      VenueBooking.updateOne(
        { _id: venueBookingId, status: { $in: ["pending", "approved"] } },
        { $set: { status: "cancelled" } }
      );

    const booking = await VenueBooking.findById(
      venueBookingId
    ).select("venueId startDate endDate status");

    if (
      booking &&
      (booking.status === "pending" || booking.status === "approved")
    ) {
      await withVenueLock(booking.venueId.toString(), setCancelled);
    } else {
      // No active booking — nothing to lock, run the filter as-is.
      await setCancelled();
    }
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

  // Completed events are locked — no edits allowed.
  if (event.status === "completed") {
    throw new AppError("Completed events cannot be edited", 400);
  }

  // 1. Capacity check against venue
  if (data.maxParticipants && event.venueBookingId) {
    const booking = await VenueBooking.findById(event.venueBookingId).populate<{ venueId: { capacity: number } }>("venueId");
    if (booking?.venueId?.capacity && data.maxParticipants > booking.venueId.capacity) {
      throw new AppError(
        `Max participants cannot exceed venue capacity (${booking.venueId.capacity})`,
        400
      );
    }
  }

  // 2. Banner image removal
  if (data.removeBannerImage) {
    event.bannerImage = undefined;
    event.set("bannerImage", undefined);
    delete data.removeBannerImage;
    delete data.bannerImage;
  }

  // 3. Multi-day clearing
  const isEndCleared = data.removeEventEndDate || data.eventEndDate === null;
  if (isEndCleared) {
    event.eventEndDate = undefined;
    event.set("eventEndDate", undefined);
    delete data.removeEventEndDate;
    delete data.eventEndDate;
  }

  // 4. Pricing & Team size type switches
  if (data.eventType === "free") {
    event.ticketPrice = undefined;
    event.set("ticketPrice", undefined);
    delete data.ticketPrice;
  } else if (data.eventType === "paid") {
    const effectivePrice = data.ticketPrice ?? event.ticketPrice;
    if (!effectivePrice || effectivePrice <= 0) {
      throw new AppError("ticketPrice is required for paid events", 400);
    }
  }

  if (data.registrationType === "individual") {
    event.teamSize = undefined;
    event.set("teamSize", undefined);
    delete data.teamSize;
  } else if (data.registrationType === "team") {
    const effectiveTeamSize = data.teamSize ?? event.teamSize;
    if (!effectiveTeamSize || effectiveTeamSize < 2) {
      throw new AppError("teamSize must be at least 2 for team registration", 400);
    }
  }

  // 5. Date calculation
  const nextStart = data.eventDate ? new Date(data.eventDate) : event.eventDate;
  const nextEnd = isEndCleared
    ? nextStart
    : data.eventEndDate
      ? new Date(data.eventEndDate)
      : event.eventEndDate ?? nextStart;

  if (nextEnd < nextStart) {
    throw new AppError("eventEndDate must be on or after eventDate", 400);
  }

  const rangeChanged =
    !isSameCalendarDay(event.eventDate, nextStart) ||
    !isSameCalendarDay(event.eventEndDate ?? event.eventDate, nextEnd);

  if (rangeChanged && event.venueBookingId) {
    const oldVenueBookingId = event.venueBookingId;
    const oldBooking = await VenueBooking.findById(oldVenueBookingId).select(
      "venueId organizationId status startDate endDate"
    );

    if (
      oldBooking &&
      oldBooking.status !== "cancelled" &&
      oldBooking.status !== "rejected"
    ) {
      // Lock the venue so a concurrent move/booking cannot observe a stale
      // overlap while the range changes.
      const newBooking = await withVenueLock(
        oldBooking.venueId.toString(),
        async () => {
          // Check the new date range is free (the old booking is excluded
          // from the check since we are about to cancel it).
          const conflict = await bookingService.hasOverlap(
            oldBooking.venueId.toString(),
            nextStart,
            nextEnd,
            oldVenueBookingId.toString(),
            ["approved", "pending"]
          );
          if (conflict) {
            throw new AppError(
              "This venue is already booked for the selected date",
              409
            );
          }

          // Free the previous booking so those dates become available again.
          await VenueBooking.updateOne(
            { _id: oldVenueBookingId },
            { $set: { status: "cancelled" } }
          );

          // Fetch the venue to recalculate the booking amount for the new range.
          const venue = await Venue.findById(oldBooking.venueId).select("pricePerDay");
          const days =
            Math.round(
              (nextEnd.getTime() - nextStart.getTime()) / (24 * 60 * 60 * 1000)
            ) + 1;
          const bookingAmount = (venue?.pricePerDay ?? 0) * days;

          // Create a fresh booking for the new date range.
          const created = await VenueBooking.create({
            organizationId: oldBooking.organizationId,
            venueId: oldBooking.venueId,
            requestedBy: event.createdBy,
            startDate: nextStart,
            endDate: nextEnd,
            bookingAmount,
            status: "pending",
            paymentStatus: "pending",
          });

          return created;
        }
      );

      // Point the event to the new booking and save with the new dates.
      Object.assign(event, data);
      event.venueBookingId = newBooking._id;

      // Rescheduled event requires venue owner re-approval before it can be published!
      if (event.status !== "cancelled") {
        event.status = "draft";
      }

      await event.save();
      return event;
    }
  }

  Object.assign(event, data);

  // Automatically recalculate status based on the new dates
  if (event.status !== "draft" && event.status !== "cancelled") {
    event.status = nextStatusFor(new Date(), nextStart, nextEnd);
  }

  await event.save();

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
