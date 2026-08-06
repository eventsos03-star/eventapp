# EventOS Database Design

This document defines the MongoDB (Mongoose) schema for EventOS. It is split by module so each feature area can be built and documented independently.

Status: **Auth module designed and implemented. Event-domain modules are roadmap only.**

---

## Module 1: Auth (implemented)

Collections: `users`, `sessions`, `auditLogs`.

### 1.1 `users`

File: `src/models/user.model.ts`

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `_id` | ObjectId | PK | |
| `firstName` | string | required, max 50, trim | |
| `lastName` | string | required, max 50, trim | |
| `email` | string | required, **unique**, lowercase, trim | Login identifier |
| `password` | string (bcrypt hash) | `select: false` | Only present for `local` users |
| `provider` | enum `local \| google` | default `local` | How the account signs in |
| `googleId` | string | **sparse unique index** | Only for Google accounts |
| `avatar` | string (URL) | optional | Set from Google picture; uploads later |
| `emailVerified` | boolean | default `false` | Set true on verify |
| `status` | enum `ACTIVE \| PENDING \| BLOCKED` | default `PENDING`, indexed | PENDING → ACTIVE after email verify |
| `role` | enum `USER \| ADMIN` | default `USER` | Global role. Per-org roles live in `organizationMembers` later |
| `verificationToken` | string | single-use, cleared | SHA-256 hash of raw token |
| `verificationExpires` | Date | 24h | |
| `resetPasswordToken` | string | single-use, cleared | SHA-256 hash of raw token |
| `resetPasswordExpires` | Date | 30min | |
| `newEmail` | string | optional | Reserved: email-change flow |
| `emailChangeToken` / `emailChangeExpires` | string / Date | optional | Reserved: email-change flow |
| `twoFactorEnabled` | boolean | default `false` | Reserved: 2FA |
| `twoFactorSecret` | string | optional | Reserved: 2FA (store encrypted) |
| `failedLoginAttempts` | number | default `0` | Reserved: DB-level lockout |
| `lockUntil` | Date | optional | Reserved: DB-level lockout |
| `deletedAt` | Date \| null | default `null`, indexed | Soft delete; all queries filter `deletedAt: null` |
| `createdAt` / `updatedAt` | Date | auto | `timestamps: true` |

**Indexes**

- `email` — unique
- `googleId` — unique, sparse
- `status`
- `deletedAt`

**Never stored**

- Refresh tokens (hashed, stored in `sessions`)
- Raw verification/reset tokens (only SHA-256 hashes)
- Password history

**API projection (`toSafeObject`)** — what the API exposes:

`id, firstName, lastName, email, provider, googleId, avatar, emailVerified, status, role, createdAt, updatedAt`

### 1.2 `sessions`

File: `src/models/session.model.ts`

Represents a logged-in device. The session `_id` is embedded in the JWT so it can be looked up on refresh.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `_id` | ObjectId | PK | Embedded in access & refresh JWTs as `sessionId` |
| `user` | ObjectId ref `User` | required, indexed | |
| `refreshToken` | string | required | SHA-256 hash, never plaintext |
| `browser` | string | default `''` | UAParser result |
| `ip` | string | default `''` | |
| `userAgent` | string | default `''` | |
| `expiresAt` | Date | required | 30 days |
| `createdAt` / `updatedAt` | Date | auto | |

**Indexes**

- `expiresAt` — TTL index (`expireAfterSeconds: 0`) auto-deletes expired sessions
- `refreshToken` — for fast lookup on refresh
- `user` — for "logout all devices"

**Behavior**

- Login / Google login / refresh creates a new session and rotates the refresh token.
- Logout deletes one session; logout-all deletes all for the user.
- Password reset deletes every session; change-password deletes all except the current one.
- A refresh with a deleted/expired/mismatched token → 401.

### 1.3 `auditLogs` (recommended, not yet implemented)

Write-once security log. Cheap, useful for support and security review.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `_id` | ObjectId | PK | |
| `user` | ObjectId ref `User` | indexed | null for events without a user |
| `action` | string | required | `REGISTER`, `LOGIN`, `LOGIN_FAILED`, `VERIFY_EMAIL`, `FORGOT_PASSWORD`, `RESET_PASSWORD`, `CHANGE_PASSWORD`, `LOGOUT`, `LOGOUT_ALL`, `GOOGLE_LINK`, `GOOGLE_CREATE`, `ROLE_CHANGED`, `STATUS_CHANGED`, `BLOCKED` |
| `ip` | string | optional | |
| `userAgent` | string | optional | |
| `metadata` | object | optional | e.g. `{ reason: 'too many attempts' }` |
| `createdAt` | Date | auto | |

**Indexes**

- `user` + `createdAt` — audit trail per user
- `createdAt` — TTL index (90-day retention)

### Auth module relationship diagram

```
users 1 ──── * sessions        (a user has many active sessions)
users 1 ──── * auditLogs       (a user generates many audit events)
```

---

## Module 2: Organizations (roadmap)

Collections: `organizations`, `organizationMembers`.

- `organizations`: `name`, `slug` (unique), `owner` (ref `User`), `logo`, `description`, `deletedAt`, timestamps.
- `organizationMembers`: `organization` (ref), `user` (ref), `role` (`OWNER | ORGANIZER | STAFF | MEMBER`), `status` (`INVITED | ACTIVE`), `invitedBy`, timestamps. Unique index `{ organization, user }`.

Per-organization roles live here — auth answers "who are you", this answers "what can you do here".

## Module 3: Event domain (roadmap)

Collections: `events`, `venues`, `categories`, `eventTickets`.

- `events`: `organization` (ref), `title`, `description`, `venue` (ref), `category` (ref), `startsAt`, `endsAt`, `status` (`DRAFT | PUBLISHED | CANCELLED | COMPLETED`), `coverImage`, `capacity`, `createdBy` (ref `User`), `deletedAt`, timestamps. Indexes: `organization + status`, `startsAt`.
- `venues`: `name`, `address`, `city`, `country`, `lat`, `lng`, `capacity`.
- `categories`: `name`, `slug`.
- `eventTickets`: `event` (ref), `name`, `price`, `quantity`, `sold`, `startsAt`, `endsAt`.

## Module 4: Sales (roadmap)

Collections: `orders`, `tickets`, `payments`.

- `orders`: `user` (ref), `event` (ref), `orderNumber` (unique), `items`, `total`, `status` (`PENDING | PAID | REFUNDED | CANCELLED`), `expiresAt`.
- `tickets`: `order` (ref), `event` (ref), `ticketType` (ref `eventTickets`), `seat`, `qrCode` (unique hash), `status` (`ISSUED | CHECKED_IN | REFUNDED`), `checkedInAt`.
- `payments`: `order` (ref), `user` (ref), `provider` (`STRIPE | RAZORPAY`), `amount`, `currency`, `status`, `providerRef`.

## Module 5: Ops (roadmap)

Collections: `notifications`, `uploads`.

- `notifications`: `user` (ref), `type`, `title`, `body`, `readAt`, `data`.
- `uploads`: `user` (ref), `provider`, `key`, `url`, `mime`, `size`.
