# EventOS — Knowledge: Venue Booking

Source files inspected: `server/src/modules/venue/venueBooking.model.ts`, `server/src/modules/booking/booking.service.ts`, `booking.validator.ts`, `booking.controller.ts`, `booking.routes.ts`.

## Purpose

A VenueBooking is a request to hold a venue for an inclusive date range (`startDate`–`endDate`) on behalf of an organization. It is created automatically when an event is created, and its approval status gates the linked event's publication.

## Entity / Key Fields (`venueBooking.model.ts`)

- `organizationId` (ObjectId, ref `Organization`, required).
- `venueId` (ObjectId, ref `Venue`, required).
- `requestedBy` (ObjectId, ref `User`, required) — the org member who created it through event creation.
- `startDate`, `endDate` (Dates, required; validated `endDate >= startDate`).
- `bookingAmount` (number).
- `status` — `pending | approved | rejected | cancelled | completed` (default `pending`).
- `paymentStatus` — `pending | advancePaid | fullyPaid` (default `pending`).
- `cancellationReason` (string, ≤500), `cancelledBy` (ObjectId), `cancelledAt` (Date).

Indexes (non-unique): `{ venueId, status, startDate, endDate }`; `{ venueId, status }`.

## Lifecycle

1. **Created `pending`** — only via `createBooking`, called from `eventService.createEvent`. There is no standalone "book a venue" endpoint.
2. **`pending → approved`** by venue owner (`PATCH /venue-bookings/:id/approve`). On approval: overlap re-checked (409 if the slot now conflicts with an approved booking), booking set `approved`, and the **linked draft event is auto-published**.
3. **`pending → rejected`** by venue owner (`PATCH /venue-bookings/:id/reject`). Linked draft event is set to `cancelled`.
4. **Cancel** (`PATCH /venue-bookings/:id/cancel`) — by the requester (must match `requestedBy`) or an ADMIN. Only pending/approved can be cancelled; only when `startDate` is in the future. Sets cancelled + reason/metadata and sets linked event to `cancelled`. **No refund logic exists in code.**
5. **`completed`** — the status enum exists; no server code path transitions a booking to `completed` (no confirmation/checkout endpoint).
6. There is **no editing of bookings** — dates change only via `eventService.updateEvent`, which rewrites `startDate`/`endDate` on the linked booking (and does not recompute `bookingAmount`).

## Workflows

### Create (`booking.service.createBooking`, called internally)
- Validates requested org via `isOrgEligible(userId, organizationId)`: org must exist, not deleted, status `approved`; and the user must be the org **owner or an accepted member** (else 403).
- Valves: venue must exist, not deleted, status `approved`.
- Overlap check `hasOverlap(venueId, startDate, endDate, excludedBookingId?)` — by default blocks on other `approved` bookings (blocking statuses list default: `['approved']`); used with `['pending','approved']` at approval time to be stricter than default. Returns `{ hasOverlap, existingBooking }`; throws `409` when overlapping.
- `bookingAmount = venue.pricePerDay * countDays(startDate, endDate)` where `countDays` is inclusive (diffInDays + 1).
- Result: booking created with `status: 'pending'`, `paymentStatus: 'pending'`. Booking is stored even if a same-date pending booking exists (default overlap only checks approved).

### Availability
- `GET /venue-bookings/venue/:venueId/availability` (`authenticate`): venue must be approved or owned by the requester; returns pending + approved bookings with date range + status, sorted.

### List for venue (`GET /venue-bookings/venue/:venueId`, `authenticate`)
- Returns bookings for the venue if requester is venue owner or ADMIN.

### Get by id (`GET /venue-bookings/:id`, `authenticate`)
- Visible to: venue owner, ADMIN, or an owner/member of the booking's organization.

### Approve / Reject / Cancel (all `authenticate`)
- Approve: only venue owner. Pending only. Re-checks overlap against `['pending','approved']`; auto-publishes linked draft event.
- Reject: only venue owner. Pending only. Cancels linked event if `draft`.
- Cancel: `requestedBy` or ADMIN; pending/approved only; future `startDate` only. Cancels linked event.

## Validation Rules (`booking.validator.ts`)

- `createBookingSchema`: `{ eventId, venueId, startDate, endDate }` — `startDate <= endDate` (refine). NOTE: `eventId` is validated but **unused** by `createBooking` (the service signature takes no eventId; the event link is established later by `eventService`). 
- `bookingIdParamSchema`, `venueBookingsParamSchema` — ObjectId params.
- `cancelBookingSchema`: `cancellationReason` optional, max 500.

## Business Rules

- **Single active-slot semantics are NOT atomic.** Overlap is a check-then-insert race: two concurrent approvals/creations for the same upcoming date can both pass `hasOverlap` and both become `approved`, because there is no unique database constraint on `(venueId, date, status)`. Recommended fix (not implemented): add a `days: Date[]` array to `VenueBooking` plus a partial unique index `{ venueId: 1, day: 1 }` with `partialFilterExpression: { status: { $in: ['pending','approved'] } }` — multi-key unique index enforces day-level atomicity on Atlas M0 without transactions.
- Venue payment (`paymentStatus`, `advancePercentage`, `bookingPaymentPolicy`) is **not wired**: no code updates `paymentStatus` for bookings and the payment module's `VenueBooking` reference path is unwired (see certificate/payment knowledge note).
- Cancellation only cancels, never refunds. `completed` is never set by any handler.