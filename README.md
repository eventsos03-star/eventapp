# EventOS

Full-stack monorepo for EventOS — a secure event platform.

- **`server/`** — Authentication backend: Node.js, Express, TypeScript, MongoDB Atlas, Mongoose, JWT, bcrypt, Zod, Nodemailer. Registration, email verification, login/logout, refresh tokens, sessions, password flows, Google OAuth.
- **`client/`** — Frontend: Next.js (App Router) + React + TypeScript. Complete auth UI: login, register, email verification, password reset, profile management, Google one-tap sign-in.

Both apps live in a single git repository.

## Quick start

```bash
npm install                # root tools (concurrently)
npm run install:all        # server + client dependencies

# configure .env files first (see below)

npm run dev                # starts both: server on :5000, client on :3000
```

Open **http://localhost:3000**. The Next.js dev server rewrites `/api` to `http://localhost:5000`, so cookies and CORS just work.

## Environment setup

### `server/.env`

Copy `server/.env.example`. Key values:

| Variable                                   | Required | Notes                                                                    |
| ------------------------------------------ | -------- | ------------------------------------------------------------------------ |
| `MONGO_URI`                                | Yes      | MongoDB Atlas connection string                                          |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Yes      | Generate two different random values                                     |
| `SMTP_*`                                   | No       | Without it, verification/reset links print to the console in development |
| `GOOGLE_CLIENT_ID`                         | No*      | Must match the client's value                                            |
| `CLIENT_URL`                               | Yes      | `http://localhost:3000` in development                                   |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### `client/.env`

Copy `client/.env.example` and set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (the same value as the server's `GOOGLE_CLIENT_ID`) to enable Google sign-in.

## Running the apps individually

```bash
npm run dev:server    # tsx watch — server at http://localhost:5000
npm run dev:client    # next dev — client at http://localhost:3000
```

## Useful scripts

| Script                | What it does                      |
| --------------------- | --------------------------------- |
| `npm run dev`         | Runs server + client concurrently |
| `npm run build`       | Builds both apps                  |
| `npm run typecheck`   | Type-checks both apps             |
| `npm run install:all` | Installs deps for both apps       |

## Project structure

```
eventapp/
├── package.json          # root scripts (concurrently)
├── server/
│   ├── src/
│   │   ├── config/       # env (Zod-validated), MongoDB connection
│   │   ├── controllers/  # thin HTTP handlers
│   │   ├── middleware/   # authenticate, authorize, validate, rate limits, error
│   │   ├── models/       # User, Session (Mongoose)
│   │   ├── routes/       # auth routes + router index
│   │   ├── services/     # auth, token, user, email
│   │   ├── validators/   # Zod schemas for every request
│   │   ├── emails/       # HTML templates for verify / reset emails
│   │   ├── app.ts
│   │   └── server.ts
│   └── scripts/          # smoke tests
├── client/
│   ├── next.config.ts    # rewrites /api → http://localhost:5000
│   └── src/
│       ├── app/          # routes: /, /login, /register, /verify-email,
│       │                 # /forgot-password, /reset-password, /dashboard, not-found
│       ├── components/   # AuthShell, Field, GoogleButton, Layout, guards
│       ├── context/      # AuthProvider / useAuth
│       ├── lib/          # API client, Google Identity helpers
│       └── types/        # shared types (User, API responses)
└── docs/                 # design docs
```

## API

Base URL (dev): `http://localhost:5000/api` — all routes prefixed `/api/auth`.

| Method | Route                          | Auth   | Body / Notes                                                                        |
| ------ | ------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| POST   | `/auth/register`               | —      | `firstName`, `lastName`, `email`, `password` (min 8). Sends verification email.     |
| GET    | `/auth/verify-email?token=...` | —      | Link sent by email. One-time use, 24h expiry.                                       |
| POST   | `/auth/login`                  | —      | `email`, `password`. Sets httpOnly refresh cookie, returns `{ accessToken, user }`. |
| POST   | `/auth/refresh`                | cookie | Rotates the refresh token and returns a new access token.                           |
| POST   | `/auth/logout`                 | cookie | Ends the current session.                                                           |
| POST   | `/auth/logout-all`             | Bearer | Ends every session for the user.                                                    |
| POST   | `/auth/forgot-password`        | —      | `email`. Sends a reset link if the account exists.                                  |
| POST   | `/auth/reset-password`         | —      | `token`, `password`. Invalidates all sessions.                                      |
| POST   | `/auth/change-password`        | Bearer | `currentPassword`, `newPassword`. Logs out other devices.                           |
| POST   | `/auth/google`                 | —      | `credential` (Google ID token). Links or creates the account.                       |
| GET    | `/auth/me`                     | Bearer | Current user profile.                                                               |
| PATCH  | `/auth/me`                     | Bearer | `firstName` / `lastName` update.                                                    |
| GET    | `/health`                      | —      | Health check.                                                                       |

Response format: `{ "success": true, "message": "...", "data": {} }`. Errors: `{ "success": false, "message": "..." }`.

## Google OAuth setup

1. [Google Cloud Console](https://console.cloud.google.com) → create a project → **APIs & Services → OAuth consent screen**.
2. **Credentials → Create Credentials → OAuth client ID** → type _Web application_.
   - Authorized JavaScript origins: `http://localhost:3000`
3. Put the **Client ID** in both `server/.env` (`GOOGLE_CLIENT_ID`) and `client/.env` (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
4. The client loads Google Identity Services (`gsi/client`) in the root layout, renders the one-tap button, and POSTs the ID token to `/auth/google`. The backend verifies it against Google's `tokeninfo` endpoint on every request.

## Security notes

- Helmet, strict CORS (only `CLIENT_URL`, credentials enabled), rate limiting on all auth routes.
- bcrypt password hashing, generic login errors (no account enumeration), httpOnly secure cookies.
- Email verification and password reset tokens are random 32-byte values, stored hashed, one-time use, with expiry.
- Access token: 15 min, sent as `Authorization: Bearer`. Refresh token: 30 days, httpOnly cookie, stored as SHA-256 hash, rotated on refresh. Refresh-token reuse is blocked.
