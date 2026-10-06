# EventOS — Knowledge: Venue

Source files inspected: `server/src/modules/venue/venue.model.ts`, `venue.service.ts`, `venue.validator.ts`, `venue.controller.ts`, `venue.routes.ts`, `server/src/middleware/venueFormData.middleware.ts`, `server/src/middleware/venueImageUpload.ts`, `server/src/services/s3.service.ts`, `server/src/modules/location/geocoding.service.ts`, `server/src/modules/location/nominatim.provider.ts`, `server/src/modules/venue/venueBooking.model.ts`.

## Purpose

A Venue is a bookable location owned by a venue owner. It can be put on booking hold for a date range by an organization, producing a `VenueBooking` (see booking.md).

## Entity / Key Fields (`venue.model.ts`)

- `ownerId` (ObjectId, ref `User`, required) — the venue owner.
- `venueName` (string, required), `description` (string).
- `images` — array of `{ url, key }` (single image in practice; upload flow replaces the array).
- `location` — `{ type: 'Point', coordinates: [longitude, latitude], address: { street, city, state, postalCode, country } }` (order: lng, lat). Index: `2dsphere`.
- `capacity` (number), `pricePerDay` (number).
- `bookingPaymentPolicy` — `fullpayment | advanceAllowed | payAfterEvent` (default `fullpayment`); `advancePercentage` (1–100, present).
- `status` — `pending | approved | rejected | blocked` (default `pending`).
- `isDeleted` (boolean, default false).

## Lifecycle

1. **Created as `pending`** — venue owner submits venue. No role gate at creation; any authenticated user can create (ownerId = `req.user.id`).
2. **`pending → approved | rejected`** — only ADMIN does this (`PATCH /venues/:id/approve`, `PATCH /venues/:id/reject`). Only a pending venue can be approved/rejected.
3. **`blocked`** — applied by admin flow (no dedicated code path for blocking beyond status filter).
4. **Deletion** — soft delete (`isDeleted: true`) by owner or ADMIN; best-effort S3 image deletion.

## Workflows

### Create (`POST /venues`, `authenticate`)
- Multipart form with up to **1 image, max 5MB**, allowed MIME types: `image/jpeg | image/png | image/gif | image/webp | image/avif` (multer `venueImageUpload`).
- `venueFormData.middleware` parses the `location` JSON string and coerces `capacity`, `pricePerDay`, `advancePercentage` to numbers.
- Image uploaded to S3 first (key pattern `venue-images/{venueId}/{uuid}.{ext}`), then venue doc created with image ref. On failure, uploaded S3 object is rolled back (deleted).
- Owner default status `pending`.

### Update (`PATCH /venues/:id`, `authenticate`)
- Owner-scoped (`findOneAndUpdate({ _id, ownerId: req.user.id })`). New image (if provided) replaces the existing image array; old S3 keys deleted after success (best-effort rollback).
- Status/`ownerId` not modifiable through this path.

### Delete / image deletion
- `DELETE /venues/:id` — owner or ADMIN; soft delete; best-effort S3 cleanup of image keys.
- `DELETE /venues/:id/images` — owner or ADMIN; removes and deletes the S3 object for the given `key`.

### Approval flows
- Venue approval/rejection is a **separate admin action** (`PATCH /venues/:id/approve` / `:id/reject`, `authenticate` + ADMIN check in controller). Venue owner approval (`venue-owner` approve/reject, see admin.routes) only flips the user's `venueOwnerStatus` and bulk-publishes their pending venues — distinct from per-venue approve.

### Public listing (`GET /venues`, `GET /venues/admin`, `GET /venues/my`, `GET /venues/:id`)
- `GET /venues` — public; approved + not deleted; filters: `city` (regex on `location.address.city`), `capacity` (gte), `pricePerDay` (lte with max cap), `page`/`limit`; optional nearby search via `lat`, `lng`, `radius` (km, default 25, max 500) using `$geoNear` from **approved** venues.
- `GET /venues/admin` — `authenticate` + ADMIN; all venues.
- `GET /venues/my` — `authenticate`; venues by `ownerId`.
- `GET /venues/:id` — public; any venue by id (no status filter).

## Validation Rules (`venue.validator.ts`)

- `venueName` required, 3–120 chars; `description` required 3–2000.
- `location.coordinates` must be valid `[lng, lat]` within bounds; `location.address` required fields.
- `capacity` integer ≥ 1; `pricePerDay` ≥ 0.
- `bookingPaymentPolicy` ∈ {fullpayment, advanceAllowed, payAfterEvent}; `advancePercentage` 1–100 (required when advanceAllowed? schema: optional present, validated range).
- Query validators for list filters (city, capacity, price, page, limit, radius).

## Business Rules

- A venue must be `approved` before it can be booked: `bookingService.createBooking` rejects non-approved venues.
- `pricePerDay` drives `bookingAmount = pricePerDay * number_of_days` (inclusive of both start and end day — see booking.md `countDays`).
- `bookingPaymentPolicy` / `advancePercentage` exist on the model and validator but are **never used by the booking or payment modules** — venue booking payment is not implemented end-to-end (see booking.md / payment notes).
- Geocoding: `GET /venues/geocode/search?q=` and `GET /venues/geocode/reverse?lat=&lng=` (public). Default provider Nominatim (OSM), User-Agent `EventOS/1.0`, search limit 5. Reverse returns 404 if no result.