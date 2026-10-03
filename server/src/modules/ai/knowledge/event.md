# EventOS — Knowledge: Event

Source files inspected: `server/src/modules/event/event.model.ts`, `event.service.ts`, `event.validator.ts`, `event.controller.ts`, `event.routes.ts`, `public-event.service.ts`, `public-event.controller.ts`, plus dependent modules (`venue`, `venueBooking`, `booking`, `organization`, `registration`, `payment`).

## Purpose

An Event is the core published unit of the platform. An organization books a venue for a date range and attaches an event to that booking. Events support free vs paid tickets and individual vs team registration.

## Entity / Key Fields (`event.model.ts`)

- `organizationId` (ObjectId, ref `Organization`, required) — owning organization.
- `venueBookingId` (ObjectId, ref `VenueBooking`, optional) — links to the venue booking created with the event. Created at event creation; cleared? (only set at creation).
- `createdBy` (ObjectId, ref `User`, required).
- `eventName` (string, required).
- `description` (string).
- `bannerImage` (object `{ url, publicId }` — publicId present but no S3 upload flow for event banners exists on the server; banner is passed as input).
- `eventType` — `free | paid`.
- `registrationType` — `team | individual`.
- `maxParticipants` (number), `registeredParticipants` (number, default 0, min 0).
- `registrationStartDate`, `registrationEndDate` (dates).
- `eventDate` (date), `eventEndDate` (date, optional — defaults to `eventDate`).
- `certificateEnabled` (boolean, default false).
- `status` — `draft | published | ongoing | completed | cancelled` (default `draft`).
- `ticketPrice` (number, optional — for paid), `teamSize` (number, optional — for team).

## Lifecycle

1. **Created as `draft`** — `createEvent` first creates a `VenueBooking` (start = `eventDate`, end = `eventEndDate ?? eventDate`) via `bookingService.createBooking`, then creates the Event in `draft` status. If event creation fails after booking creation, the booking is left behind (no transaction/rollback observed).
2. **`draft → published`** — only via `publishEvent` (`PATCH /events/:id/publish`), which requires the linked venue booking to have `status === 'approved'` (throws 400 otherwise), or implicitly by `bookingService.approveBooking`, which auto-publishes a linked draft event on booking approval.
3. **`rejected booking → cancelled event`** — `bookingService.rejectBooking` auto-cancels the linked event. `cancelBooking` also sets the linked event to `cancelled`.
4. **`ongoing` / `completed`** — computed automatically by `syncEventStatuses` (no manual transitions). Uses `eventDate`/`eventEndDate` vs today (UTC day granularity). Auto-runs inside list/get flows (`getPublishedEventLists`, `getEventByOrganizationID`, `getAlleventsforadmin`, `getEventById`). Draft/cancelled events are skipped by sync.
5. **Deletion** — soft delete (`isDeleted: true`); also cancels a linked pending/approved booking.

## Workflows

### Create (`POST /events`, `authenticate` + `validate(createEventSchema)`)
- Body: `organizationId`, `venueId`, `eventName`, `eventType`, `registrationType`, `maxParticipants`, dates, plus `ticketPrice` (if paid), `teamSize` (if team), `description`, `bannerImage`.
- Validates org/venue, checks org-eligibility of the requesting user (`bookingService.isOrgEligible`), venue must be approved, then creates pending booking and the draft event.

### Publish (`PATCH /events/:id/publish`)
- Requires linked booking `approved` (else 400). Only `draft` can be published (409 if already published).

### Update (`PATCH /events/:id`, `validate(updateEventSchema)`)
- Allowed fields are constrained by `updateEventSchema`. Recomputes date range from `eventDate`/`eventEndDate`; if range changed, re-checks overlap against other non-cancelled/rejected bookings for the venue (409 on conflict), and updates the linked booking's `startDate`/`endDate` in sync. Does NOT recompute `bookingAmount` when the range changes (amount is only set at booking creation).

### Delete (`DELETE /events/:id`)
- Soft delete + cancels linked booking.

### Registrations / Participants
- `GET /events/:id/participants` — requires org role `user_manager` or `certificate_manager`; returns registrations populated with participant (and team leader info), rosterCount.
- `PATCH /events/:id/participants/:regId/check-in` — requires org role `user_manager`; toggles check-in. NOTE: `registration.model.ts` has NO `checkedIn` / `checkedInAt` field in the schema, so the toggle is not persisted (schema strict mode drops unknown fields). This is an observable gap: check-in does not actually save.

### Public list (`GET /events`, `GET /events/public`)
- `GET /events` → `getPublishedEventLists`: published, not deleted, order by `eventDate`, populated venue + booking.
- `GET /events/public` → `publicEventService.getAllEvents`: published only; search by `eventName` regex (case-insensitive); filter by `eventType`; location filter matches venue `location.address` via regex → collects venue ids → matches venueBookings (ANY status, see note) → events; sort options `upcoming` (eventDate asc), `latest` (createdAt desc), `price-low`, `price-high`; returns paginated fields incl. `capacity`, `remainingSeats`, `registrationStatus` (open/closed/full), `ticketPrice`, date, venue info, banner.
  - GAP: the location filter pulls venue bookings of **all statuses** (`VenueBooking.find({ venueId: { $in: venueIds } })` with no status filter) at `public-event.service.ts`, so location-filtered listing may include events whose booking was rejected/cancelled.
- `GET /events/public/:id` → `getEventByIdPublic`: published event detail.

### Admin list (`GET /events/admin/allevents`)
- Route is **not protected** by `authenticate`/`authorize` in `event.routes.ts` (registered as `router.get("/admin/allevents", eventController.getAlleventsforadmin)`). Returns all non-deleted events incl. drafts.

## Validation Rules (`event.validator.ts`)

- ObjectId params for `id`.
- `eventName`: 3–120 chars.
- `eventType` ∈ {free, paid}; `registrationType` ∈ {team, individual}.
- `paid` requires `ticketPrice >= 0`; `team` requires `teamSize >= 2` (integer).
- `maxParticipants > 0`.
- `registrationStartDate < registrationEndDate`; `registrationEndDate <= eventDate`; `eventEndDate >= eventDate`; dates must be valid; `eventDate` not in the past.
- `description` ≤ (validated within schema; max length enforced).
- `bannerImage` optional object.

## Business Rules

- An event cannot be published (thus not listed publicly) until the venue booking is approved by the venue owner.
- Event creation is coupled to booking creation: no booking → no event. Booking amount = `pricePerDay * countDays`.
- Capacity is enforced at registration time via an atomic `$inc` guard (see registration.md). `registeredParticipants` is a counter, not a count of docs.
- Paid events are not gated at the server: the registration endpoints do NOT verify `eventType === 'paid'` or that a successful payment exists. Payment verification creates the registration after payment; but the general `POST /events/registration/:id/individual|team` endpoints also succeed for paid events without payment. (See registration.md / payment.md notes.)