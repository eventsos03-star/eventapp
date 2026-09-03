#!/usr/bin/env node
/**
 * Migration: backfill legacy Venue location documents into GeoJSON Point form.
 *
 * Legacy venues stored `location` as `{ address, city, state }` with no
 * coordinates. A MongoDB `2dsphere` index cannot be built over such docs
 * ("Can't extract geo keys" / unknown GeoJSON type).
 *
 * This script rewrites legacy `location` objects into a valid GeoJSON `Point`
 * at the sentinel coordinate [0, 0] (which is in the ocean, so it never
 * matches real geographic searches), preserving all existing address text.
 * It then creates the `2dsphere` index, which now builds successfully.
 *
 * [0, 0] is treated as "no real location" everywhere in the UI, so owners can
 * still set their real coordinates later via the venue edit page.
 *
 * Usage (from server/):
 *   node scripts/migrate-venue-location.mjs
 *
 * Idempotent: running it again only touches docs still missing coordinates.
 */
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is required (set it in the environment).');
  process.exit(1);
}

const SENTINEL = [0, 0];

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const Venue = mongoose.connection.collection('venues');

  // Find legacy locations: missing the "coordinates" array.
  const legacy = await Venue.find({
    $and: [
      { location: { $exists: true } },
      { 'location.coordinates': { $exists: false } },
    ],
  }).toArray();

  console.log(`Found ${legacy.length} legacy venue(s) without coordinates.`);

  let updated = 0;
  for (const venue of legacy) {
    const loc = venue.location || {};
    const nextLocation = {
      type: 'Point',
      coordinates: SENTINEL,
      address: loc.address || '',
      city: loc.city || '',
      state: loc.state || '',
      country: loc.country || '',
      postalCode: loc.postalCode || '',
      formattedAddress: loc.formattedAddress || '',
    };
    await Venue.updateOne(
      { _id: venue._id },
      { $set: { location: nextLocation } },
    );
    updated++;
  }

  console.log(`Backfilled ${updated} venue(s).`);

  console.log('Creating 2dsphere index on venues.location...');
  await Venue.createIndex({ location: '2dsphere' });

  const indexes = await Venue.indexes();
  console.log('Indexes now on venues:');
  for (const i of indexes) {
    console.log(`  ${i.name}: ${JSON.stringify(i.key)}${i['2dsphereIndexVersion'] ? ` (2dsphere v${i['2dsphereIndexVersion']})` : ''}`);
  }

  await mongoose.disconnect();
  console.log('Migration complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
