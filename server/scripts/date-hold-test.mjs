// Tests for the temporary MongoDB date-hold system.
//
// Runs against the compiled server output (npm run build first — wired up as
// `npm run test:holds --prefix server`). Requires a running MongoDB
// (MONGO_URI).
//
// Verifies:
//   1. Selecting a range creates a hold; availability + status show "held".
//   2. Other users cannot book a held range; unrelated ranges stay open.
//   3. The holder can book their own held range; the hold is consumed.
//   4. Overlapping hold by another user -> 409; own overlapping hold replaces.
//   5. Release: non-owner -> 404, owner -> dates become available.
//   6. Refresh: non-owner -> 404, owner -> expiry extended / dates changed.
//   7. Expired hold no longer blocks; refresh of expired hold -> 404.
//   8. Creating a hold on an already-booked range -> 409.

import mongoose from 'mongoose';

const REQUIRED_ENV = ['MONGO_URI'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`date-hold-test requires: ${missing.join(', ')}`);
  process.exit(1);
}

if (!process.env.JWT_ACCESS_SECRET) process.env.JWT_ACCESS_SECRET = 't'.repeat(32);
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'r'.repeat(32);
if (!process.env.RAZORPAY_KEY_ID) process.env.RAZORPAY_KEY_ID = 'ci_dummy_key_id';
if (!process.env.RAZORPAY_KEY_SECRET) process.env.RAZORPAY_KEY_SECRET = 'ci_dummy_key_secret';

const { default: Venue } = await import('../dist/modules/venue/venue.model.js');
const { default: VenueBooking } = await import('../dist/modules/venue/venueBooking.model.js');
const { default: VenueDateHold } = await import('../dist/modules/venue/venueDateHold.model.js');
const { default: Organization } = await import('../dist/modules/organization/organization.model.js');
const bookingService = await import('../dist/modules/venue/booking/booking.service.js');
const dateHoldService = await import('../dist/modules/venue/booking/dateHold.service.js');

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
    organizationName: `Hold Org ${new mongoose.Types.ObjectId()}`,
    organizationType: 'event_org',
    description: 'date hold test org',
    email: `hold-${new mongoose.Types.ObjectId()}@test.local`,
    ownerId,
    address: { country: 'India' },
    status: 'approved',
  });
}

async function makeVenue(ownerId, name) {
  return Venue.create({
    ownerId,
    venueName: name,
    description: 'date hold test venue',
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

async function cleanup(...docs) {
  for (const doc of docs) {
    if (!doc) continue;
    const collection = doc.constructor.collection;
    if (collection) await collection.deleteMany({ _id: doc._id });
  }
}

async function scenarioCreateAndShow() {
  console.log('\nScenario 1: create hold, availability + status show it as held');
  const userA = new mongoose.Types.ObjectId();
  const orgA = await makeOrg(userA);
  const venue = await makeVenue(userA, `Hold Create ${new mongoose.Types.ObjectId()}`);

  try {
    const hold = await dateHoldService.createHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      startDate: day(10),
      endDate: day(12),
    });

    assert(Boolean(hold.holdId), 'hold created with a holdId');
    assert(
      new Date(hold.expiresAt).getTime() > Date.now(),
      'hold expiry is in the future'
    );

    const availability = await bookingService.getVenueAvailability(venue._id.toString());
    const heldEntry = availability.find(
      (entry) => entry.status === 'held' && +new Date(entry.startDate) === +day(10)
    );
    assert(Boolean(heldEntry), 'availability lists the range with status "held"');

    const heldStatus = await dateHoldService.getRangeStatus(
      venue._id.toString(),
      day(11),
      day(11)
    );
    assert(heldStatus === 'temporarily_held', `range inside hold is temporarily_held (got ${heldStatus})`);

    const freeStatus = await dateHoldService.getRangeStatus(
      venue._id.toString(),
      day(15),
      day(15)
    );
    assert(freeStatus === 'available', `range outside hold is available (got ${freeStatus})`);
  } finally {
    await cleanup(venue, orgA);
    await VenueBooking.deleteMany({ venueId: venue._id });
    await VenueDateHold.deleteMany({ venueId: venue._id });
  }
}

async function scenarioHoldBlocksOtherUsers() {
  console.log('\nScenario 2: held range blocks other users, free range does not');
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  const orgA = await makeOrg(userA);
  const orgB = await makeOrg(userB);
  const venue = await makeVenue(userA, `Hold Block ${new mongoose.Types.ObjectId()}`);

  try {
    await dateHoldService.createHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      startDate: day(10),
      endDate: day(12),
    });

    let blockedCode = null;
    let blockedMessage = '';
    try {
      await bookingService.createBooking({
        userId: userB.toString(),
        organizationId: orgB._id.toString(),
        venueId: venue._id.toString(),
        startDate: day(11),
        endDate: day(11),
      });
    } catch (error) {
      blockedCode = statusCodeOf(error);
      blockedMessage = error.message;
    }
    assert(blockedCode === 409, `booking inside someone else's hold -> 409 (got ${blockedCode})`);
    assert(
      blockedMessage.includes('temporarily held'),
      'conflict message mentions the temporary hold'
    );

    const booking = await bookingService.createBooking({
      userId: userB.toString(),
      organizationId: orgB._id.toString(),
      venueId: venue._id.toString(),
      startDate: day(15),
      endDate: day(15),
    });
    assert(Boolean(booking), 'range outside the hold books normally');
  } finally {
    await cleanup(venue, orgA, orgB);
    await VenueBooking.deleteMany({ venueId: venue._id });
    await VenueDateHold.deleteMany({ venueId: venue._id });
  }
}

async function scenarioOwnerBooksAndConsumes() {
  console.log('\nScenario 3: holder books own range, hold is consumed');
  const userA = new mongoose.Types.ObjectId();
  const orgA = await makeOrg(userA);
  const venue = await makeVenue(userA, `Hold Consume ${new mongoose.Types.ObjectId()}`);

  try {
    await dateHoldService.createHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      startDate: day(10),
      endDate: day(12),
    });

    const booking = await bookingService.createBooking({
      userId: userA.toString(),
      organizationId: orgA._id.toString(),
      venueId: venue._id.toString(),
      startDate: day(10),
      endDate: day(11),
    });
    assert(Boolean(booking), "holder's own booking is not blocked by their hold");

    const activeHolds = await VenueDateHold.countDocuments({
      venueId: venue._id,
      userId: userA,
      expiresAt: { $gt: new Date() },
    });
    assert(activeHolds === 0, `own hold consumed after booking (left: ${activeHolds})`);

    const status = await dateHoldService.getRangeStatus(
      venue._id.toString(),
      day(10),
      day(10)
    );
    assert(status === 'booked', `booked range reports booked (got ${status})`);
  } finally {
    await cleanup(venue, orgA);
    await VenueBooking.deleteMany({ venueId: venue._id });
    await VenueDateHold.deleteMany({ venueId: venue._id });
  }
}

async function scenarioOverlapRules() {
  console.log('\nScenario 4: overlapping hold by other user -> 409, own -> replace');
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  const venue = await makeVenue(userA, `Hold Overlap ${new mongoose.Types.ObjectId()}`);

  try {
    const first = await dateHoldService.createHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      startDate: day(20),
      endDate: day(22),
    });

    let otherCode = null;
    try {
      await dateHoldService.createHold({
        userId: userB.toString(),
        venueId: venue._id.toString(),
        startDate: day(21),
        endDate: day(21),
      });
    } catch (error) {
      otherCode = statusCodeOf(error);
    }
    assert(otherCode === 409, `other user's overlapping hold -> 409 (got ${otherCode})`);

    const replaced = await dateHoldService.createHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      startDate: day(21),
      endDate: day(23),
    });
    assert(
      String(replaced.holdId) === String(first.holdId),
      'same user re-selecting reuses the same hold document'
    );
    assert(
      +new Date(replaced.endDate) === +day(23),
      'replaced hold carries the new date range'
    );

    const total = await VenueDateHold.countDocuments({ venueId: venue._id });
    assert(total === 1, `still exactly one hold document for the venue (got ${total})`);
  } finally {
    await cleanup(venue);
    await VenueDateHold.deleteMany({ venueId: venue._id });
  }
}

async function scenarioRelease() {
  console.log('\nScenario 5: release — non-owner 404, owner frees the dates');
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  const venue = await makeVenue(userA, `Hold Release ${new mongoose.Types.ObjectId()}`);

  try {
    const hold = await dateHoldService.createHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      startDate: day(25),
      endDate: day(25),
    });

    let otherCode = null;
    try {
      await dateHoldService.releaseHold({
        userId: userB.toString(),
        venueId: venue._id.toString(),
        holdId: String(hold.holdId),
      });
    } catch (error) {
      otherCode = statusCodeOf(error);
    }
    assert(otherCode === 404, `non-owner release -> 404 (got ${otherCode})`);

    await dateHoldService.releaseHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      holdId: String(hold.holdId),
    });
    assert(true, 'owner release succeeds');

    const status = await dateHoldService.getRangeStatus(
      venue._id.toString(),
      day(25),
      day(25)
    );
    assert(status === 'available', `dates available again after release (got ${status})`);
  } finally {
    await cleanup(venue);
    await VenueDateHold.deleteMany({ venueId: venue._id });
  }
}

async function scenarioRefresh() {
  console.log('\nScenario 6: refresh — non-owner 404, owner extends expiry');
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  const venue = await makeVenue(userA, `Hold Refresh ${new mongoose.Types.ObjectId()}`);

  try {
    const hold = await dateHoldService.createHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      startDate: day(26),
      endDate: day(26),
    });

    // Shorten the expiry so the extension is unambiguous.
    await VenueDateHold.updateOne(
      { _id: hold.holdId },
      { $set: { expiresAt: new Date(Date.now() + 10_000) } }
    );

    let otherCode = null;
    try {
      await dateHoldService.refreshHold({
        userId: userB.toString(),
        venueId: venue._id.toString(),
        holdId: String(hold.holdId),
      });
    } catch (error) {
      otherCode = statusCodeOf(error);
    }
    assert(otherCode === 404, `non-owner refresh -> 404 (got ${otherCode})`);

    const before = await VenueDateHold.findById(hold.holdId);
    const refreshed = await dateHoldService.refreshHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      holdId: String(hold.holdId),
    });
    assert(
      new Date(refreshed.expiresAt).getTime() > new Date(before.expiresAt).getTime(),
      'owner refresh extends the expiry'
    );

    const moved = await dateHoldService.refreshHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      holdId: String(hold.holdId),
      startDate: day(27),
      endDate: day(27),
    });
    assert(
      +new Date(moved.endDate) === +day(27),
      'refresh can move the held range to new dates'
    );
  } finally {
    await cleanup(venue);
    await VenueDateHold.deleteMany({ venueId: venue._id });
  }
}

async function scenarioExpiredHold() {
  console.log('\nScenario 7: expired hold stops blocking, refresh -> 404');
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  const orgA = await makeOrg(userA);
  const orgB = await makeOrg(userB);
  const venue = await makeVenue(userA, `Hold Expire ${new mongoose.Types.ObjectId()}`);

  try {
    const hold = await dateHoldService.createHold({
      userId: userA.toString(),
      venueId: venue._id.toString(),
      startDate: day(27),
      endDate: day(27),
    });

    await VenueDateHold.updateOne(
      { _id: hold.holdId },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    const status = await dateHoldService.getRangeStatus(
      venue._id.toString(),
      day(27),
      day(27)
    );
    assert(status === 'available', `expired hold no longer blocks (got ${status})`);

    const booking = await bookingService.createBooking({
      userId: userB.toString(),
      organizationId: orgB._id.toString(),
      venueId: venue._id.toString(),
      startDate: day(27),
      endDate: day(27),
    });
    assert(Boolean(booking), 'another user can book the previously held range');

    let refreshCode = null;
    try {
      await dateHoldService.refreshHold({
        userId: userA.toString(),
        venueId: venue._id.toString(),
        holdId: String(hold.holdId),
      });
    } catch (error) {
      refreshCode = statusCodeOf(error);
    }
    assert(refreshCode === 404, `refresh of expired hold -> 404 (got ${refreshCode})`);
  } finally {
    await cleanup(venue, orgB);
    await VenueBooking.deleteMany({ venueId: venue._id });
    await VenueDateHold.deleteMany({ venueId: venue._id });
  }
}

async function scenarioHoldOnBookedRange() {
  console.log('\nScenario 8: creating a hold on a booked range -> 409');
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  const orgA = await makeOrg(userA);
  const venue = await makeVenue(userA, `Hold Booked ${new mongoose.Types.ObjectId()}`);

  try {
    await bookingService.createBooking({
      userId: userA.toString(),
      organizationId: orgA._id.toString(),
      venueId: venue._id.toString(),
      startDate: day(30),
      endDate: day(30),
    });

    let code = null;
    let message = '';
    try {
      await dateHoldService.createHold({
        userId: userB.toString(),
        venueId: venue._id.toString(),
        startDate: day(30),
        endDate: day(30),
      });
    } catch (error) {
      code = statusCodeOf(error);
      message = error.message;
    }
    assert(code === 409, `hold on booked range -> 409 (got ${code})`);
    assert(
      message.includes('already booked'),
      'conflict message says the venue is already booked'
    );
  } finally {
    await cleanup(venue, orgA);
    await VenueBooking.deleteMany({ venueId: venue._id });
    await VenueDateHold.deleteMany({ venueId: venue._id });
  }
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  await VenueDateHold.init();

  await scenarioCreateAndShow();
  await scenarioHoldBlocksOtherUsers();
  await scenarioOwnerBooksAndConsumes();
  await scenarioOverlapRules();
  await scenarioRelease();
  await scenarioRefresh();
  await scenarioExpiredHold();
  await scenarioHoldOnBookedRange();

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
