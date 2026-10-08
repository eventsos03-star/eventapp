import { randomUUID } from "node:crypto";

import VenueBookingLock from "../modules/venue/venueBookingLock.model.js";
import { AppError } from "./AppError.js";

const LOCK_TTL_MS = 30_000;
const MAX_ATTEMPTS = 5;

export class LockConflictError extends AppError {
  constructor() {
    super(
      "This venue is currently being booked or updated. Please try again.",
      409
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


async function acquireLock(
  venueId: string,
  owner: string
): Promise<boolean> {
  const now = new Date();

  try {
    await VenueBookingLock.findOneAndUpdate(
      { venueId, expiresAt: { $lte: now } },
      {
        $set: {
          locked: true,
          owner,
          expiresAt: new Date(now.getTime() + LOCK_TTL_MS),
        },
      },
      { upsert: true }
    );
    return true;
  } catch (error) {
    
    if ((error as { code?: number })?.code === 11000) return false;
    throw error;
  }
}


export async function withVenueLock<T>(
  venueId: string,
  callback: () => Promise<T>
): Promise<T> {
  const owner = randomUUID();
  let acquired = false;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    acquired = await acquireLock(venueId, owner);
    if (acquired) break;

    if (attempt + 1 < MAX_ATTEMPTS) {
      await sleep(100 * (attempt + 1));
    }
  }

  if (!acquired) throw new LockConflictError();

  try {
      return await callback();
  } finally {
    await VenueBookingLock.deleteOne({ venueId, owner }).catch(() => {
         });
  }
}
