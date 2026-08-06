# EventOS — Auth Backend

Production-ready authentication backend for EventOS. This is the first module of the project and includes everything needed for user accounts: registration, email verification, login/logout, refresh tokens, sessions, password flows, and Google OAuth.

Built with Node.js, Express, TypeScript, MongoDB Atlas, Mongoose, JWT, bcrypt, Zod, Nodemailer. ES Modules throughout. No Redis, no Docker, no test framework required.

## Quick start

```bash
npm install
cp .env.example .env     # then fill in the values below
npm run dev
```

The server only starts listening after a successful MongoDB Atlas connection.

## What you must set in `.env`

| Variable | Where to get it | Required to run |
|---|---|---|
| `MONGO_URI` | MongoDB Atlas → your cluster → **Connect → Drivers**. Use the `mongodb+srv://` URI and replace `<password>` with your database user password. Example: `mongodb+srv://eventos:yourpassword@cluster0.xxxxx.mongodb.net/eventos` | Yes |
| `JWT_ACCESS_SECRET` | Generate with the command below (use a different value for each) | Yes |
| `JWT_REFRESH_SECRET` | Same as above — must differ from access secret | Yes |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Any real SMTP provider (Gmail, Resend, etc.). For Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=<your@gmail.com>`, `SMTP_PASS=<16-char App Password>` (Google Account → Security → 2-Step Verification → App passwords). **No code changes needed to swap providers.** | No* |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials → OAuth client ID. Backend checks Google tokens are issued for this app. The frontend needs the same value. | No** |
| `CLIENT_URL` | Your frontend URL. The verification/reset links point here. Default `http://localhost:3000` | Yes |

\* Without SMTP credentials the server still runs; registration works but emails are not delivered. In `development`, the verification/reset links are printed to the console so you can test the full flow locally.

\** Without `GOOGLE_CLIENT_ID` Google login still works (token audience is not checked). Set it to reject tokens issued for other apps.

Generate the JWT secrets (run twice, keep both values):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a project.
2. **APIs & Services → OAuth consent screen** → configure (External, add your email).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → type *Web application*.
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000` (your frontend handles the popup/redirect)
4. Grab the **Client ID**. Put it in the backend `.env` as `GOOGLE_CLIENT_ID` and in the frontend `.env` as `VITE_GOOGLE_CLIENT_ID`.
5. Frontend: use Google Identity Services to obtain an ID token (`credential`) and POST it to `POST /api/auth/google` with body `{ "credential": "..." }`.
   - If the email already exists, the Google account is **linked** to the existing user (no duplicates, password login keeps working).
   - If the account is new, a user is created with provider `google`, already verified and `ACTIVE`.
   - The backend verifies the token against Google's `tokeninfo` endpoint on every request.

## Running

```bash
npm run dev        # tsx watch — development
npm run build      # compile TypeScript to dist/
npm start          # run compiled output
npm run typecheck  # typecheck only
```

Optional dev smoke test (requires a local MongoDB, e.g. on `127.0.0.1:27018`):

```bash
npx tsx scripts/smoke.mjs
```

## API

Base URL: `http://localhost:5000/api` — all routes are prefixed `/api/auth`.

| Method | Route | Auth | Body / Notes |
|---|---|---|---|
| POST | `/auth/register` | — | `firstName`, `lastName`, `email`, `password` (min 8). Sends verification email. |
| GET | `/auth/verify-email?token=...` | — | Link sent by email. One-time use, 24h expiry. |
| POST | `/auth/login` | — | `email`, `password`. Sets httpOnly refresh cookie, returns `{ accessToken, user }`. |
| POST | `/auth/refresh` | cookie | Rotates the refresh token and returns a new access token. |
| POST | `/auth/logout` | cookie | Ends the current session (deletes the session document). |
| POST | `/auth/logout-all` | Bearer | Ends every session for the user. |
| POST | `/auth/forgot-password` | — | `email`. Sends a reset link if the account exists (does not reveal whether it does). |
| POST | `/auth/reset-password` | — | `token`, `password`. Invalidates all sessions. |
| POST | `/auth/change-password` | Bearer | `currentPassword`, `newPassword`. Logs out other devices. |
| POST | `/auth/google` | — | `credential` (Google ID token). Links or creates the account. |
| GET | `/auth/me` | Bearer | Current user profile, email, verification status. |
| GET | `/health` | — | Health check. |

### Authentication

- **Access token** — short-lived (15 min), sent as `Authorization: Bearer <token>`.
- **Refresh token** — 30 days, stored in an **httpOnly, `SameSite=Lax` cookie** (`secure` in production). Stored server-side in the `sessions` collection as a SHA-256 hash, rotated on every refresh.
- Session document records the browser, IP, and user agent. Expired sessions are cleaned up automatically by a MongoDB TTL index.

### Response format

```json
{ "success": true, "message": "Login successful", "data": {} }
```

Errors:

```json
{ "success": false, "message": "Invalid email or password" }
```

## Project structure

```
src/
├── config/        # env (Zod-validated), MongoDB connection
├── controllers/   # thin HTTP handlers
├── middleware/    # authenticate, authorize, validate, rate limits, error, 404
├── models/        # User, Session (Mongoose)
├── routes/        # auth routes + router index
├── services/      # auth, token, user, email
├── validators/    # Zod schemas for every request
├── utils/         # AppError, asyncHandler, response helpers, tokens
├── types/         # shared types + Express request augmentation
├── constants/     # statuses, providers, expiries
├── emails/        # HTML templates for verify / reset emails
├── app.ts         # Express app
└── server.ts      # connects to DB, then starts listening
```

## Security notes

- Helmet, strict CORS (only `CLIENT_URL`, credentials enabled), rate limiting on all auth routes (stricter on login/forgot-password).
- bcrypt password hashing, generic login errors (no account enumeration), httpOnly secure cookies.
- Email verification and password reset tokens are random 32-byte values, stored hashed, one-time use, with expiry.
- Zod validation on every request — the frontend is never trusted.
- Soft delete ready: `User.deletedAt`; queries already filter `deletedAt: null`.
- Refresh-token reuse is blocked: after a token is rotated, the old token no longer matches any session.
