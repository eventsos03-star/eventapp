import VenueDateHold, {
  type IVenueDateHold,
} from "../venueDateHold.model.js";
import { hasOverlap } from "./booking.service.js";
import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/AppError.js";
import { withVenueLock } from "../../../utils/mongoLock.js";

function holdExpiry(): Date {
  return new Date(
    Date.now() + env.VENUE_HOLD_TTL_MINUTES * 60_000
  );
}

function toHold(hold: IVenueDateHold) {
  return {
    holdId: hold._id,
    venueId: hold.venueId,
    startDate: hold.startDate,
    endDate: hold.endDate,
    expiresAt: hold.expiresAt,
  };
}


export async function hasActiveHoldOverlap(
  venueId: string,
  startDate: Date,
  endDate: Date,
  excludeUserId?: string
): Promise<boolean> {
  const filter: Record<string, unknown> = {
    venueId,
    expiresAt: { $gt: new Date() },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };

  if (excludeUserId) {
    filter.userId = { $ne: excludeUserId };
  }

  const hold = await VenueDateHold.findOne(filter).select("_id");
  return Boolean(hold);
}

export async function getRangeStatus(
  venueId: string,
  startDate: Date,
  endDate: Date
): Promise<"available" | "booked" | "temporarily_held"> {
  const booked = await hasOverlap(venueId, startDate, endDate, undefined, [
    "approved",
    "pending",
  ]);
  if (booked) return "booked";

  const held = await hasActiveHoldOverlap(venueId, startDate, endDate);
  if (held) return "temporarily_held";

  return "available";
}

export async function createHold(params: {
  userId: string;
  venueId: string;
  startDate: Date;
  endDate: Date;
}) {
  const { userId, venueId, startDate, endDate } = params;

  return withVenueLock(venueId, async () => {
    const booked = await hasOverlap(
      venueId,
      startDate,
      endDate,
      undefined,
      ["approved", "pending"]
    );
    if (booked) {
      throw new AppError(
        "This venue is already booked for part or all of the selected date range",
        409
      );
    }

    const heldByOther = await hasActiveHoldOverlap(
      venueId,
      startDate,
      endDate,
      userId
    );
    if (heldByOther) {
      throw new AppError(
        "These dates are temporarily held by another user. Please try again shortly.",
        409
      );
    }

    const expiresAt = holdExpiry();

    // One active hold per user per venue: re-selecting replaces it.
    const existing = await VenueDateHold.findOne({
      venueId,
      userId,
      expiresAt: { $gt: new Date() },
    });

    if (existing) {
      existing.startDate = startDate;
      existing.endDate = endDate;
      existing.expiresAt = expiresAt;
      await existing.save();
      return toHold(existing);
    }

    const hold = await VenueDateHold.create({
      venueId,
      userId,
      startDate,
      endDate,
      expiresAt,
    });

    return toHold(hold);
  });
}

export async function refreshHold(params: {
  userId: string;
  venueId: string;
  holdId: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const { userId, venueId, holdId } = params;

  const hold = await VenueDateHold.findOne({
    _id: holdId,
    venueId,
    userId,
    expiresAt: { $gt: new Date() },
  });

  if (!hold) {
    throw new AppError("Date hold not found or has expired", 404);
  }

  const startDate = params.startDate ?? hold.startDate;
  const endDate = params.endDate ?? hold.endDate;

  return withVenueLock(venueId, async () => {
    const datesChanged =
      +startDate !== +hold.startDate || +endDate !== +hold.endDate;

    if (datesChanged) {
      const booked = await hasOverlap(
        venueId,
        startDate,
        endDate,
        undefined,
        ["approved", "pending"]
      );
      if (booked) {
        throw new AppError(
          "This venue is already booked for part or all of the selected date range",
          409
        );
      }

      const heldByOther = await hasActiveHoldOverlap(
        venueId,
        startDate,
        endDate,
        userId
      );
      if (heldByOther) {
        throw new AppError(
          "These dates are temporarily held by another user. Please try again shortly.",
          409
        );
      }
    }

    hold.startDate = startDate;
    hold.endDate = endDate;
    hold.expiresAt = holdExpiry();
    await hold.save();

    return toHold(hold);
  });
}

export async function releaseHold(params: {
  userId: string;
  venueId: string;
  holdId: string;
}) {
  const { userId, venueId, holdId } = params;

  const result = await VenueDateHold.deleteOne({
    _id: holdId,
    venueId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError("Date hold not found", 404);
  }
}
