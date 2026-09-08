import Venue from "../venue.model.js";
import VenueBooking from "../venueBooking.model.js";
import Organization from "../../organization/organization.model.js";
import OrganizationMember from "../../organization/organizationMember.model.js";
import { AppError } from "../../../utils/AppError.js";

const dayMs = 24 * 60 * 60 * 1000;

const NOT_DELETED = {
  $or: [
    { isDeleted: false },
    { isDeleted: { $exists: false } },
  ],
};

/* -------------------------------- */
/* Organization eligibility */
/* -------------------------------- */

async function isOrgEligible(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const org = await Organization.findById(organizationId).select(
    "ownerId status isDeleted"
  );

  if (!org) return false;

  if (org.isDeleted || org.status !== "approved") {
    return false;
  }

  if (
    org.ownerId &&
    org.ownerId.toString() === userId
  ) {
    return true;
  }

  const member = await OrganizationMember.findOne({
    organizationId,
    userId,
    isDeleted: false,
    inviteStatus: "accepted",
  }).select("_id");

  return Boolean(member);
}

/* -------------------------------- */
/* Check booking overlap */
/* -------------------------------- */

async function hasOverlap(
  venueId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const filter: Record<string, unknown> = {
    venueId,

    // Only approved bookings block availability.
    status: "approved",

    // Overlap condition: startDate <= requestedEndDate AND endDate >= requestedStartDate
    startDate: {
      $lte: endDate,
    },

    endDate: {
      $gte: startDate,
    },
  };

  if (excludeBookingId) {
    filter._id = {
      $ne: excludeBookingId,
    };
  }

  const conflict = await VenueBooking.findOne(filter)
    .select("_id");

  return Boolean(conflict);
}

/* -------------------------------- */
/* Calculate number of days */
/* -------------------------------- */

function countDays(
  startDate: Date,
  endDate: Date
): number {
  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  ).getTime();

  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  ).getTime();

  return Math.round((end - start) / dayMs) + 1;
}

/* -------------------------------- */
/* Create booking */
/* -------------------------------- */

export const createBooking = async (params: {
  userId: string;
  organizationId: string | null;
  venueId: string;
  startDate: Date;
  endDate: Date;
}) => {
  const {
    userId,
    organizationId,
    venueId,
  } = params;

  // params.startDate/endDate may arrive as ISO strings (e.g. from req.body),
  // so coerce to real Date instances before using Date methods on them.
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);

  if (!organizationId) {
    throw new AppError(
      "You must own or belong to an approved organization to book a venue",
      403
    );
  }

  /* Check organization */

  const eligible = await isOrgEligible(
    userId,
    organizationId
  );

  if (!eligible) {
    throw new AppError(
      "You are not authorized to book for this organization",
      403
    );
  }

  /* Check venue */

  const venue = await Venue.findOne({
    _id: venueId,
    ...NOT_DELETED,
  });

  if (!venue) {
    throw new AppError(
      "Venue not found",
      404
    );
  }

  if (venue.status !== "approved") {
    throw new AppError(
      "This venue is not available for booking",
      400
    );
  }

  /* Check date overlap */

  const conflict = await hasOverlap(
    venueId,
    startDate,
    endDate
  );

  if (conflict) {
    throw new AppError(
      "This venue is already booked for part or all of the selected date range",
      409
    );
  }

  /* Calculate price */

  const bookingAmount =
    venue.pricePerDay *
    countDays(startDate, endDate);

  /* Create pending booking */

  const booking = await VenueBooking.create({
    organizationId,
    venueId,
    requestedBy: userId,
    startDate,
    endDate,
    bookingAmount,
    status: "pending",
    paymentStatus: "pending",
  });

  return booking;
};

/* -------------------------------- */
/* Venue availability */
/* -------------------------------- */

export const getVenueAvailability = async (
  venueId: string
) => {
  const venue = await Venue.findOne({
    _id: venueId,
    ...NOT_DELETED,
  }).select("_id status");

  if (!venue) {
    throw new AppError(
      "Venue not found",
      404
    );
  }

  if (venue.status !== "approved") {
    throw new AppError(
      "This venue is not available for booking",
      400
    );
  }

  const bookings = await VenueBooking.find({
    venueId,
    status: "approved",
  })
    .select("startDate endDate")
    .sort({
      startDate: 1,
    });

  return bookings.map((booking) => ({
    startDate: booking.startDate,
    endDate: booking.endDate,
  }));
};

/* -------------------------------- */
/* Get bookings for venue owner */
/* -------------------------------- */

export const getBookingsForVenue = async (params: {
  userId: string;
  userRole: string;
  venueId: string;
}) => {
  const {
    userId,
    userRole,
    venueId,
  } = params;

  const venue = await Venue.findOne({
    _id: venueId,
    ...NOT_DELETED,
  }).select("ownerId");

  if (!venue) {
    throw new AppError(
      "Venue not found",
      404
    );
  }

  const isOwner =
    venue.ownerId &&
    venue.ownerId.toString() === userId;

  const isAdmin =
    userRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError(
      "You are not authorized to view this venue",
      403
    );
  }

  return VenueBooking.find({
    venueId,
  })
    .populate(
      "requestedBy",
      "firstName lastName email"
    )
    .sort({
      startDate: 1,
    });
};

/* -------------------------------- */
/* Get booking by ID */
/* -------------------------------- */

export const getBookingById = async (params: {
  userId: string;
  userRole: string;
  organizationId: string | null;
  bookingId: string;
}) => {
  const {
    userId,
    userRole,
    organizationId,
    bookingId,
  } = params;

  const booking =
    await VenueBooking.findById(bookingId)
      .populate("venueId")
      .populate(
        "requestedBy",
        "firstName lastName email"
      );

  if (!booking) {
    throw new AppError(
      "Booking not found",
      404
    );
  }

  const venue =
    booking.venueId as unknown as {
      ownerId?: {
        toString(): string;
      };
    };

  if (!venue) {
    throw new AppError(
      "Venue not found",
      404
    );
  }

  const isOwner =
    venue.ownerId &&
    venue.ownerId.toString() === userId;

  const isAdmin =
    userRole === "ADMIN";

  if (isOwner || isAdmin) {
    return booking;
  }

  const bookingOrgId =
    booking.organizationId
      .toString();

  const ownsOrg =
    organizationId === bookingOrgId;

  const isMember =
    await OrganizationMember.findOne({
      organizationId: bookingOrgId,
      userId,
      isDeleted: false,
      inviteStatus: "accepted",
    }).select("_id");

  if (ownsOrg || Boolean(isMember)) {
    return booking;
  }

  throw new AppError(
    "You are not authorized to view this booking",
    403
  );
};

/* -------------------------------- */
/* Approve booking */
/* -------------------------------- */

export const approveBooking = async (params: {
  userId: string;
  bookingId: string;
}) => {
  const {
    userId,
    bookingId,
  } = params;

  const booking =
    await VenueBooking.findById(
      bookingId
    ).select(
      "venueId startDate endDate status"
    );

  if (!booking) {
    throw new AppError(
      "Booking not found",
      404
    );
  }

  const venue = await Venue.findOne({
    _id: booking.venueId,
    ...NOT_DELETED,
  }).select("ownerId");

  if (!venue) {
    throw new AppError(
      "Venue not found",
      404
    );
  }

  if (
    venue.ownerId &&
    venue.ownerId.toString() !== userId
  ) {
    throw new AppError(
      "Only the venue owner can approve this booking",
      403
    );
  }

  if (booking.status !== "pending") {
    throw new AppError(
      "Only pending bookings can be approved",
      400
    );
  }

  /*
   * Recheck availability at approval time.
   *
   * This is important because another booking may have
   * been approved since this request was created.
   */

  const conflict = await hasOverlap(
    booking.venueId.toString(),
    booking.startDate,
    booking.endDate,
    bookingId
  );

  if (conflict) {
    throw new AppError(
      "Approval would create a scheduling conflict for this venue",
      409
    );
  }

  return VenueBooking.findByIdAndUpdate(
    bookingId,
    {
      status: "approved",
    },
    {
      new: true,
    }
  );
};

/* -------------------------------- */
/* Reject booking */
/* -------------------------------- */

export const rejectBooking = async (params: {
  userId: string;
  bookingId: string;
}) => {
  const {
    userId,
    bookingId,
  } = params;

  const booking =
    await VenueBooking.findById(
      bookingId
    ).select(
      "venueId status"
    );

  if (!booking) {
    throw new AppError(
      "Booking not found",
      404
    );
  }

  const venue = await Venue.findOne({
    _id: booking.venueId,
    ...NOT_DELETED,
  }).select("ownerId");

  if (!venue) {
    throw new AppError(
      "Venue not found",
      404
    );
  }

  if (
    venue.ownerId &&
    venue.ownerId.toString() !== userId
  ) {
    throw new AppError(
      "Only the venue owner can reject this booking",
      403
    );
  }

  if (booking.status !== "pending") {
    throw new AppError(
      "Only pending bookings can be rejected",
      400
    );
  }

  return VenueBooking.findByIdAndUpdate(
    bookingId,
    {
      status: "rejected",
    },
    {
      new: true,
    }
  );
};