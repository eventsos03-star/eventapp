# EventOS — Knowledge: Certificate

Source files inspected: `server/src/modules/certificate/certificate.model.ts`, `certificate.service.ts`, `certificate.controller.ts`, `certificate.routes.ts`.

## Purpose

Certificates are issued per registration by an org manager (`certificate_manager`) to formalize event participation. Serving uses `eventos.app/certificates/preview` placeholder URLs by default (client preview page).

## Entity (`certificate.model.ts`)

- `registrationId` (ObjectId, ref Registration, **unique** required).
- `certificateNumber` (string, **unique** required — format `CERT-...` random).
- `certificateUrl` (string, required) — default `https://eventos.app/certificates/preview/{certificateNumber}`.
- No status field — a certificate exists or not.

## Lifecycle / Workflows

- **Issue** — `POST /certificates/issue` (`authenticate` + `requireOrgRole('certificate_manager')`; owner passes for any role). Body: `{ registrationId, certificateUrl? }`.
  - Service: registration must exist (populates event info for the URL), no duplicate certificate for that registration (409); generates `certificateNumber`; stores; if no `certificateUrl` given, uses the default preview URL.
  - NOTE: `event.certificateEnabled` is **not enforced** — issue works even if the event has `certificateEnabled: false`.
- **List by event** — `GET /certificates/event/:eventId` (`authenticate` + `requireOrgRole('certificate_manager')`). Returns registrations of the event and any certificates issued for them (certificate populated per registration).

## Validation Rules

- `issueCertificateSchema`: `registrationId` ObjectId; optional `certificateUrl`.

## Business Rules

- 1 certificate per registration (unique index → 409 on duplicate issue).
- Only org managers with `certificate_manager` role (or owner) can issue/list; the route guard is `authenticate` + `requireOrgRole`.
- Participant-facing flows (e.g., "my certificates") are not part of this module's API; certificates are surfaced to org managers. Client preview renders the served URL.