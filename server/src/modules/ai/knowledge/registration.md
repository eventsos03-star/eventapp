# EventOS — Knowledge: Registration, Teams & Tickets

Source files inspected: `server/src/modules/event/registration.model.ts`, `registration.service.ts`, `registration.controller.ts`, `registration.routes.ts`, `team.model.ts`, `ticket.model.ts`, `ticket.service.ts`, `server/src/modules/payment/payment.service.ts`, `payment.controller.ts`, `payment.routes.ts`, `payment.model.ts`.

## Purpose

Registrations attach a participant (or team) to an event and produce a Ticket. Paid events route through Razorpay order + verify; free events are registered directly. Team registrations create a Team leader-led row.

## Entities

### Registration (`registration.model.ts`)
- `eventId`, `participantId` (ObjectIds, required). Unique index `{ eventId: 1, participantId: 1 }`.
- `teamId` (ObjectId, optional — set for team registrations), `phoneNumber` (required), `collegeOrOrganization` (optional).
- NOTE: no `checkedIn`/`checkedInAt` fields in schema (event check-in deep-dive: see event.md — check-in not persisted).

### Team (`team.model.ts`)
- `eventID` (ObjectId, required), `teamName`, `leaderID` (ObjectId), `members` — array of `{ name, email, phoneNumber, collegeOrOrganization }` (email required per member), `teamCode` (unique).

### Ticket (`ticket.model.ts`)
- `registrationId` (unique), `ticketNumber` (unique), `status` — `active | used` (default active).

## Workflows

### Direct registration (no payment) — `POST /events/registration/:id/individual` and `/team` (`authenticate`)
- Individual: event must exist, not deleted, status `published`; registration date within `[registrationStartDate, registrationEndDate]`; capacity check via atomic update `registeredParticipants < maxParticipants` (`$inc` alone is racy — see note); creates Registration + Ticket (`EVT-...` random number).
  - Paid events are NOT blocked here: no `eventType`/payment check in this handler (the same as payment path — see below).
- Team: same event gates with `registrationType === 'team'`; validates `members.length + 1 === event.teamSize` and member emails; creates a Team with unique `teamCode`; leader gets the Registration + Ticket; capacity uses team size.

### Paid flow — Razorpay
- `POST /events/payment` (`authenticate`, body `{ eventId, registrationType }`): event must be published + paid with `ticketPrice > 0`; amount = `ticketPrice * (team ? teamSize : 1)`; creates a Razorpay order (`kind` from config) and a pending Payment record (`referenceType: 'Registration'`, `paymentType: 'Registration'`). Payment `referenceId` NOT set at order time.
- `POST /events/payment/verify` (`authenticate`): verifies Razorpay signature HMAC; checks `payerId` matches `req.user.id` and `eventId` matches the event on the payment; on success creates the registration (individual or team) via `createRegistrationAfterPayment`, marks payment `success` with `transactionId` + `referenceId = registration._id`; failure/unmatched → error + payment remains failed/pending.

### Ticket retrieval — `GET /events/registration/:registrationId/ticket` (`authenticate`)
- Only the registrant (participantId = user) can read their ticket (`ticket.service.getTicket`). Returns ticket + populated registration(event/team). No admin path to view another user's ticket through this route.

## Validation Rules

- No zod validator on registration routes (controller-level checks only).
- Phone required; team member emails required; `teamSize` exact-match enforced at service.

## Business Rules

- Capacity guard is atomic increment (`findOneAndUpdate` with `$lt` condition) — protects against 2 concurrent registrations overbooking at insert time, but `registeredParticipants` can then be inconsistent with deleted/confirmed rows (counter, never decremented by cancellations — there is no user-facing unregister flow).
- One registration per (event, participant): unique index enforces it; service returns 409 on duplicate.
- **A known inconsistency**: both the free-form registration endpoint and the paid (post-verify) path can create registrations for the same paid event — no server-side enforcement that paid events must be paid. Document answers around "how do I register for a paid event" with the Razorpay flow as the intended path.
- Ticket verification (`ticket.service.ticketVerification`) exists but is **not mounted** in `registration.routes.ts` (controller method `verifieTicket` has no route).
- Cancel/unregister/refund: not implemented on the server.