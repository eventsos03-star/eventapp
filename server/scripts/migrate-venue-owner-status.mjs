#!/usr/bin/env node
/**
 * Migration: backfill the one-time "venue owner" decision onto User documents.
 *
 * Prior to this migration, venue-owner approval/rejection was only visible via
 * each venue's `status` field — so an already-approved owner who added a new
 * venue would re-appear as a "pending" owner. Now the decision is stored once
 * on the User (`venueOwnerStatus`) and stays fixed.
 *
 * Rules per user (derived from their non-deleted venues):
 *   - approved venue seen          -> 'approved'   (an approved venue proves it)
 *   - rejected venue, no approved  -> 'rejected'
 *   - only pending venues          -> 'pending'
 *   - no venues at all             -> left unset (not a venue owner yet)
 *
 * Idempotent: users that already have a `venueOwnerStatus` are never touched.
 *
 * Usage (from server/):
 *   node scripts/migrate-venue-owner-status.mjs
 */
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is required (set it in the environment).');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const User = mongoose.connection.collection('users');
  const Venue = mongoose.connection.collection('venues');

  const owners = await Venue.aggregate([
    { $match: { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] } },
    { $group: { _id: '$ownerId', statuses: { $addToSet: '$status' } } },
  ]).toArray();

  console.log(`Found ${owners.length} user(s) owning venues.`);

  let updated = 0;
  let unchanged = 0;
  for (const { _id: ownerId, statuses } of owners) {
    if (!ownerId) continue;

    const existing = await User.findOne({ _id: ownerId });
    if (!existing) continue;
    if (existing.venueOwnerStatus) {
      unchanged++;
      continue;
    }

    let status;
    if (statuses.includes('approved')) status = 'approved';
    else if (statuses.includes('rejected')) status = 'rejected';
    else status = 'pending';

    await User.updateOne({ _id: ownerId }, { $set: { venueOwnerStatus: status } });
    updated++;
  }

  console.log(`Backfilled ${updated} user(s); ${unchanged} already had a status.`);
  await mongoose.disconnect();
  console.log('Migration complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});