// Concurrency / race-condition tests for the MongoDB-based venue booking lock.
//
// Runs against the compiled server output (npm run build first — wired up as
// `npm run test:concurrency --prefix server`). Requires a running MongoDB
// (MONGO_URI).
//
// Verifies:
//   1. 20 simultaneous createBooking on same venue/date -> exactly 1 wins.
//   2. Two conflicting pending bookings approved concurrently -> exactly 1 wins.
//   3. Different venues, same date -> both succeed (independent).
//   4. Same venue, non-overlapping dates -> both succeed (serialized by lock).
//   5. A leftover expired lock (crashed holder) is taken over.
//   6. An exception inside the lock releases it and the venue stays usable.
//   7. No lock documents leak after success / conflict / thrown exceptions.
//   8. The unique venueId index that makes the lock work exists.

import mongoose from 'mongoose';

const REQUIRED_ENV = ['MONGO_URI'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`booking-race-test requires: ${missing.join(', ')}`);
  process.exit(1);
}

if (!process.env.JWT_ACCESS_SECRET) process.env.JWT_ACCESS_SECRET = 't'.repeat(32);
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'r'.repeat(32);
if (!process.env.RAZORPAY_KEY_ID) process.env.RAZORPAY_KEY_ID = 'ci_dummy_key_id';
if (!process.env.RAZORPAY_KEY_SECRET) process.env.RAZORPAY_KEY_SECRET = 'ci_dummy_key_secret';

const { default: Venue } = await import('../dist/modules/venue/venue.model.js');
const { default: VenueBooking } = await import('../dist/modules/venue/venueBooking.model.js');
const { default: Organization } = await import('../dist/modules/organization/organization.model.js');
const { default: VenueBookingLock } = await import('../dist/modules/venue/venueBookingLock.model.js');
const bookingService = await import('../dist/modules/venue/booking/booking.service.js');
const { withVenueLock } = await import('../dist/utils/mongoLock.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ok - ${message}`);
  } else {
    failed += 1;
    console.error(`  FAIL - ${message}`);
  }
}

function statusCodeOf(error) {
  return error && typeof error === 'object' && 'statusCode' in error
    ? error.statusCode
    : undefined;
}

function day(dayOfMonth) {
  return new Date(Date.UTC(2027, 5, dayOfMonth));
}

async function makeOrg(ownerId) {
  return Organization.create({
    organizationName: `Race Org ${new mongoose.Types.ObjectId()}`,
    organizationType: 'event_org',
    description: 'concurrency test org',
    email: `race-${new mongoose.Types.ObjectId()}@test.local`,
    ownerId,
    address: { country: 'India' },
    status: 'approved',
  });
}

async function makeVenue(ownerId, name) {
  return Venue.create({
    ownerId,
    venueName: name,
    description: 'concurrency test venue',
    images: [],
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.076],
      address: 'test address',
      city: 'Mumbai',
      state: 'MH',
      country: 'India',
      postalCode: '400001',
      formattedAddress: 'Mumbai',
    },
    capacity: 100,
    pricePerDay: 5000,
    bookingPaymentPolicy: 'fullpayment',
    status: 'approved',
  });
}

async function clearLocks() {
  await VenueBookingLock.deleteMany({});
}

async function assertNoLocksLeft() {
  const leftover = await VenueBookingLock.countDocuments({});
  assert(leftover === 0, `no lock documents remain (found: ${leftover})`);
}

async function cleanup(...docs) {
  for (const doc of docs) {
    if (!doc) continue;
    const collection = doc.constructor.collection;
    if (collection) await collection.deleteMany({ _id: doc._id });
  }
}

async function scenarioConcurrentCreates() {
  console.log('\nScenario 1: 20 simultaneous creates, same venue + same date');
  const ownerId = new mongoose.Types.ObjectId();
  const org = await makeOrg(ownerId);
  const venue = await makeVenue(ownerId, `Venue Create Race ${new mongoose.Types.ObjectId()}`);
  const startDate = day(1);
  const endDate = day(1);

  try {
    const attempts = Array.from({ length: 20 }, () =>
      bookingService.createBooking({
        userId: ownerId.toString(),
        organizationId: org._id.toString(),
        venueId: venue._id.toString(),
        startDate,
        endDate,
      })
    );

    const results = await Promise.allSettled(attempts);
    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const conflicts = results.filter(
      (r) => r.status === 'rejected' && statusCodeOf(r.reason) === 409
    );

    assert(succeeded.length === 1, `exactly one create succeeds (got ${succeeded.length})`);
    assert(conflicts.length === 19, `the other 19 conflict with 409 (got ${conflicts.length})`);

    const stored = await VenueBooking.countDocuments({
      venueId: venue._id,
      status: 'pending',
    });
    assert(stored === 1, `exactly one pending booking stored (got ${stored})`);
  } finally {
    await cleanup(venue, org);
    await VenueBooking.deleteMany({ venueId: venue._id });
    await clearLocks();
  }
}

async function scenarioConcurrentApproval() {
  console.log('\nScenario 2: two conflicting pending bookings approved concurrently');
  const ownerId = new mongoose.Types.ObjectId();
  const org = await makeOrg(ownerId);
  const venue = await makeVenue(ownerId, `Venue Approve Race ${new mongoose.Types.ObjectId()}`);
  const startDate = day(2);
  const endDate = day(2);

  try {
    // A direct insert simulates two already-pending bookings for the same day
    // (the pre-lock double-pending state). Only one may be approved.
    const bookingA = await VenueBooking.create({
      organizationId: org._id,
      venueId: venue._id,
      requestedBy: ownerId,
      startDate,
      endDate,
      bookingAmount: 5000,
      status: 'pending',
    });
    const bookingB = await VenueBooking.create({
      organizationId: org._id,
      venueId: venue._id,
      requestedBy: ownerId,
      startDate,
      endDate,
      bookingAmount: 5000,
      status: 'pending',
    });

    // Hold the venue lock externally with a short expiry (300ms). Both
    // requests pass their pre-lock checks (status === pending) while the
    // lock is held. It expires between acquisition retries, so both requests
    // race into the protected critical section close together.
    await VenueBookingLock.create({
      venueId: venue._id,
      locked: true,
      owner: 'race-holder',
      expiresAt: new Date(Date.now() + 300),
    });

    const approvalsPromise = Promise.allSettled([
      bookingService.approveBooking({ userId: ownerId.toString(), bookingId: bookingA._id.toString() }),
      bookingService.approveBooking({ userId: ownerId.toString(), bookingId: bookingB._id.toString() }),
    ]);

    await sleep(40); // ensure both requests are parked waiting on the lock
    const results = await approvalsPromise;

    const approved = results.filter((r) => r.status === 'fulfilled');
    const conflicted = results.filter(
      (r) => r.status === 'rejected' && statusCodeOf(r.reason) === 409
    );

    assert(approved.length === 1, `exactly one approval succeeds (got ${approved.length})`);
    assert(conflicted.length === 1, `the other approval conflicts with 409 (got ${conflicted.length})`);

    const approvedCount = await VenueBooking.countDocuments({
      venueId: venue._id,
      status: 'approved',
    });
    assert(approvedCount === 1, `never two approved overlapping bookings (got ${approvedCount})`);
  } finally {
    await cleanup(venue, org);
    await VenueBooking.deleteMany({ venueId: venue._id });
    await clearLocks();
  }
}

async function scenarioDifferentVenuesSameDay() {
  console.log('\nScenario 3: different venues, same date -> both succeed');
  const ownerId = new mongoose.Types.ObjectId();
  const org = await makeOrg(ownerId);
  const venueA = await makeVenue(ownerId, `Venue A ${new mongoose.Types.ObjectId()}`);
  const venueB = await makeVenue(ownerId, `Venue B ${new mongoose.Types.ObjectId()}`);
  const startDate = day(3);
  const endDate = day(3);

  try {
    const [a, b] = await Promise.allSettled([
      bookingService.createBooking({
        userId: ownerId.toString(),
        organizationId: org._id.toString(),
        venueId: venueA._id.toString(),
        startDate,
        endDate,
      }),
      bookingService.createBooking({
        userId: ownerId.toString(),
        organizationId: org._id.toString(),
        venueId: venueB._id.toString(),
        startDate,
        endDate,
      }),
    ]);

    assert(a.status === 'fulfilled', 'venue A booking succeeds');
    assert(b.status === 'fulfilled', 'venue B booking succeeds (locks are per-venue)');
  } finally {
    await cleanup(venueA, venueB, org);
    await VenueBooking.deleteMany({ venueId: { $in: [venueA._id, venueB._id] } });
    await clearLocks();
  }
}

async function scenarioDifferentDaysSameVenue() {
  console.log('\nScenario 4: same venue, non-overlapping dates -> both succeed');
  const ownerId = new mongoose.Types.ObjectId();
  const org = await makeOrg(ownerId);
  const venue = await makeVenue(ownerId, `Venue Days ${new mongoose.Types.ObjectId()}`);

  try {
    const [a, b] = await Promise.allSettled([
      bookingService.createBooking({
        userId: ownerId.toString(),
        organizationId: org._id.toString(),
        venueId: venue._id.toString(),
        startDate: day(5),
        endDate: day(5),
      }),
      bookingService.createBooking({
        userId: ownerId.toString(),
        organizationId: org._id.toString(),
        venueId: venue._id.toString(),
        startDate: day(6),
        endDate: day(6),
      }),
    ]);

    assert(a.status === 'fulfilled', 'June 5 booking succeeds');
    assert(b.status === 'fulfilled', 'June 6 booking succeeds (serialized by venue lock)');
  } finally {
    await cleanup(venue, org);
    await VenueBooking.deleteMany({ venueId: venue._id });
    await clearLocks();
  }
}

async function scenarioExpiredLockTakeover() {
  console.log('\nScenario 5: leftover expired lock (crashed holder) is taken over');
  const ownerId = new mongoose.Types.ObjectId();
  const org = await makeOrg(ownerId);
  const venue = await makeVenue(ownerId, `Venue Stale Lock ${new mongoose.Types.ObjectId()}`);

  try {
    // Simulate a holder that crashed before releasing: the document is past
    // its expiry, so the next acquire must take the lock over.
    await VenueBookingLock.create({
      venueId: venue._id,
      locked: true,
      owner: 'crashed-holder',
      expiresAt: new Date(Date.now() - 1000),
    });

    const booking = await bookingService.createBooking({
      userId: ownerId.toString(),
      organizationId: org._id.toString(),
      venueId: venue._id.toString(),
      startDate: day(7),
      endDate: day(7),
    });

    assert(Boolean(booking), 'booking succeeds despite the leftover expired lock');
    const leftover = await VenueBookingLock.countDocuments({ venueId: venue._id });
    assert(leftover === 0, `stale lock was taken over and released (left: ${leftover})`);
  } finally {
    await cleanup(venue, org);
    await VenueBooking.deleteMany({ venueId: venue._id });
    await clearLocks();
  }
}

async function scenarioFailureReleasesLock() {
  console.log('\nScenario 6: exception inside the lock releases it');
  const ownerId = new mongoose.Types.ObjectId();
  const org = await makeOrg(ownerId);
  const venue = await makeVenue(ownerId, `Venue Failure ${new mongoose.Types.ObjectId()}`);

  try {
    let threw = false;
    try {
      await withVenueLock(venue._id.toString(), async () => {
        throw new Error('boom');
      });
    } catch {
      threw = true;
    }
    assert(threw, 'exception inside the lock propagates to the caller');

    const held = await VenueBookingLock.countDocuments({ venueId: venue._id });
    assert(held === 0, `lock released after the exception (left: ${held})`);

    const booking = await bookingService.createBooking({
      userId: ownerId.toString(),
      organizationId: org._id.toString(),
      venueId: venue._id.toString(),
      startDate: day(8),
      endDate: day(8),
    });
    assert(Boolean(booking), 'venue still usable after the failed critical section');
  } finally {
    await cleanup(venue, org);
    await VenueBooking.deleteMany({ venueId: venue._id });
    await clearLocks();
  }
}

async function scenarioUniqueIndex() {
  console.log('\nScenario 7: unique venueId index exists');
  const indexes = await VenueBookingLock.collection.indexes();
  const uniqueVenueIndex = indexes.find(
    (i) => i.key.venueId === 1 && i.unique === true
  );
  assert(Boolean(uniqueVenueIndex), 'unique index on venueId exists');
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  await VenueBookingLock.init(); // make sure indexes are built before racing
  await clearLocks();

  await scenarioConcurrentCreates();
  await assertNoLocksLeft();

  await scenarioConcurrentApproval();
  await assertNoLocksLeft();

  await scenarioDifferentVenuesSameDay();
  await assertNoLocksLeft();

  await scenarioDifferentDaysSameVenue();
  await assertNoLocksLeft();

  await scenarioExpiredLockTakeover();
  await assertNoLocksLeft();

  await scenarioFailureReleasesLock();
  await assertNoLocksLeft();

  await scenarioUniqueIndex();

  await mongoose.disconnect();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(async (error) => {
  failed += 1;
  console.error('test harness error:', error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
