# EventOS — Knowledge: Organization & Membership

Source files inspected: `server/src/modules/organization/organization.model.ts`, `organizationMember.model.ts`, `organization.service.ts`, `organization.validator.ts`, `organization.controller.ts`, `organization.routes.ts`, `server/src/middleware/requireOrgRole.ts`, `server/src/middleware/getOwnedOrganizationId.ts`, `server/src/middleware/getUserOrgContext.ts`.

## Purpose

An Organization is a group that books venues and runs events. Users join as members with roles; org membership drives authorization for participants, certificates, finance, and booking eligibility.

## Entity — Organization (`organization.model.ts`)

- `organizationName` (string, required).
- `organizationType` — `college | company | startup | ngo | community | event_org | other`.
- `description`, `logo`.
- `email` (string, lowercase-normalized, required), `phoneNumber`.
- `address` — `{ street, city, state, postalCode, country }` (country default `India`).
- `ownerId` (ObjectId, ref `User`, required, unique).
- `status` — `pending | approved | rejected | blocked` (default `pending`).
- `approvedAt`, `approvedBy`, `rejectionReason` (string).
- `isDeleted` (boolean, default false).

## Entity — OrganizationMember (`organizationMember.model.ts`)

- `organizationId`, `userId` (ObjectId; user not necessarily saved — invitation creates member with `inviteEmail` too).
- `inviteEmail` (string), `invitedBy` (ObjectId).
- `role` — `owner | organizer | finance_manager | user_manager | certificate_manager | member` (enum `OrganizationRole`).
- `inviteStatus` — `pending | accepted | rejected` (default `pending`).
- `isDeleted` (default false).
- Unique index `{ organizationId: 1, userId: 1 }` (partial through uniqueness on non-null userId).

## Lifecycle

1. **Create** (`POST /organizations`, `authenticate`) — creates org + owner member (role `owner`, inviteStatus `accepted`) atomically-ish. **One org per owner**: a user with an existing non-deleted org gets 400 "You already have an organization. One user can own one organization."
2. **`pending → approved | rejected`** — ADMIN only (`admin.routes`). Rejected org can be **restored/resubmitted** by owner via `PATCH /organizations/me` (owner) which resets `status: pending` and clears `rejectionReason` (approval again required). A blocked org cannot be resubmitted by owner.
3. **Deletion** — owner soft-deletes (`isDeleted: true`) via `DELETE /organizations/me`. Admin can restore (`restoreOrganization`) or permanent-delete.
4. **Membership** — `addMember` adds a member immediately with `inviteStatus: 'accepted'` (no email-send / invite flow implemented; `inviteEmail` recorded). `removeMember` soft-deletes the membership doc.

## Workflows

### My org / context
- `GET /organizations/me` (`authenticate`) → single org context: resolves via memberships first (`getUserOrgContext`: matches membership by `userId`, non-deleted; returns org + role), falling back to any owned org (`role: 'owner'`). No `get` for another org's context via this route.
- Org id + role are resolved per-request through `getUserOrgContext`/`getOwnedOrganizationId` and attached to `req.user.organizationId` / `req.user.orgRole` by auth middleware used in dependent modules.

### Members (`GET/POST /:id/members`, `DELETE /:id/members/:memberId`, all `authenticate`)
- `GET` — requires the org token user to be owner or member; returns member list (non-deleted).
- `POST` — body `{ email, role }`, role ∈ `orgRoles` (owner excluded — cannot add an owner). Invites/anchors member by email; if user with that email exists, links `userId`; dedupes active membership; sets role + inviteStatus `accepted`.
- `DELETE /:id/members/:memberId` — owner or member-manager? (route requires `authenticate`; controller/service scope — owner or the member themselves in observed service). Soft delete.

### Finance (`GET /organizations/finance`, `authenticate` + `requireOrgRole('finance_manager')`)
- Computes gross revenue from **paid events** (sum `ticketPrice * registeredParticipants` for the org's paid published events), gross venue cost from **approved + completed** bookings (`bookingAmount`) for the org, and returns `grossRevenue`, `grossVenueCost`, `netProfit`.

## Validation Rules (`organization.validator.ts`)

- `organizationName`: 1–200 chars; `organizationType` enum; `description` ≤ 2000; `email` valid; `phoneNumber` ≤ 20; `address` shape with country default India.
- Member add: `email` valid, `role` ∈ `orgRoles` (owner not allowed via this endpoint).

## Business Rules

- **Org "owner" supersedes roles**: `requireOrgRole(...roles)` returns true for the org owner regardless of listed roles; otherwise the `req.user.orgRole` must be one of the allowed roles.
- Organization must be `approved` (and not deleted) for the owner/members to be eligible to book venues (`isOrgEligible`).
- Server-side, several org member-management actions rely on ownership checks rather than fine-grained roles; authorization scope here is a known area for the RAG answer to describe conservatively (see code before asserting role claims).

## Admin Interactions (see admin.routes.md)

- Admin approve → `approvedAt/approvedBy` set; reject → `rejectionReason` required; restore; soft delete; permanent delete (requires `confirmation` name string).