process.env.MONGO_URI = 'mongodb://127.0.0.1:27018/eventos_test';
process.env.NODE_ENV = 'development';
process.env.JWT_ACCESS_SECRET = 'smoke_test_access_secret_1234567890';
process.env.JWT_REFRESH_SECRET = 'smoke_test_refresh_secret_1234567890';
process.env.ACCESS_TOKEN_EXPIRE = '15m';
process.env.REFRESH_TOKEN_EXPIRE = '30d';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';

const { default: app } = await import('../src/app.js');
const mongoose = (await import('mongoose')).default;
const { connectDB } = await import('../src/config/db.js');

await connectDB();
await mongoose.connection.dropDatabase();

const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

let passed = 0;
let failed = 0;
let lastCookies = '';

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ok - ${label}`);
  } else {
    failed++;
    console.error(`  FAIL - ${label}`);
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: lastCookies,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers?.get?.('set-cookie');
  if (setCookie) lastCookies = setCookie.split(';')[0];
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, headers: res.headers };
}

async function captureLogs(fn) {
  const lines = [];
  const original = console.log;
  console.log = (...args) => {
    lines.push(args.join(' '));
  };
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return lines.join('\n');
}

const user = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@test.dev', password: 'supersecret123' };
let r;
let logs;

console.log('\n== Verify email ==');
logs = await captureLogs(() => request('/api/auth/register', { method: 'POST', body: { firstName: 'Blaise', lastName: 'Pascal', email: 'blaise@test.dev', password: 'supersecret123' } }));
const verifyToken = logs.match(/verify-email\?token=([a-f0-9]+)/)?.[1];
assert(Boolean(verifyToken), 'verification token logged in dev mode');
r = await request(`/api/auth/verify-email?token=${verifyToken}`);
assert(r.status === 200 && r.json.data.status === 'ACTIVE', `verify-email activates account (got ${r.status})`);
r = await request(`/api/auth/verify-email?token=${verifyToken}`);
assert(r.status === 400, `verify-email token is single-use (got ${r.status})`);

console.log('\n== Register ada (capture her verify token) ==');
logs = await captureLogs(() => request('/api/auth/register', { method: 'POST', body: user }));
const adaVerifyToken = logs.match(/verify-email\?token=([a-f0-9]+)/)?.[1];
assert(Boolean(adaVerifyToken), 'ada verification token captured');

console.log('\n== Login before verification ==');
r = await request('/api/auth/login', { method: 'POST', body: { email: user.email, password: user.password } });
assert(r.status === 403, `unverified login blocked with 403 (got ${r.status})`);

console.log('\n== Login wrong password ==');
r = await request('/api/auth/login', { method: 'POST', body: { email: 'ada@test.dev', password: 'wrongpassword' } });
assert(r.status === 401 && r.json.message === 'Invalid email or password', `generic login error (got ${r.status})`);

console.log('\n== Verify ada ==');
r = await request(`/api/auth/verify-email?token=${adaVerifyToken}`);
assert(r.status === 200, `ada verified (got ${r.status})`);

console.log('\n== Login success ==');
r = await request('/api/auth/login', { method: 'POST', body: { email: user.email, password: user.password } });
assert(r.status === 200, `login returns 200 (got ${r.status})`);
assert(r.json.data.accessToken?.length > 0, 'access token issued');
assert(lastCookies.startsWith('refreshToken='), 'refresh cookie set');
const accessToken = r.json.data.accessToken;

console.log('\n== Me ==');
r = await request('/api/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
assert(r.status === 200 && r.json.data.email === user.email, `me returns profile (got ${r.status})`);

console.log('\n== Me without token ==');
r = await request('/api/auth/me');
assert(r.status === 401, `me without token returns 401 (got ${r.status})`);

console.log('\n== Refresh ==');
r = await request('/api/auth/refresh', { method: 'POST' });
assert(r.status === 200 && r.json.data.accessToken, `refresh issues new tokens (got ${r.status})`);
const oldCookie = lastCookies;
r = await request('/api/auth/refresh', { method: 'POST' });
assert(r.status === 200, 'rotated refresh token still works');
assert(oldCookie !== lastCookies, 'refresh token was rotated');

console.log('\n== Logout ==');
r = await request('/api/auth/logout', { method: 'POST' });
assert(r.status === 200, `logout returns 200 (got ${r.status})`);
r = await request('/api/auth/refresh', { method: 'POST' });
assert(r.status === 401, `refresh after logout fails (got ${r.status})`);

console.log('\n== Login again for remaining tests ==');
r = await request('/api/auth/login', { method: 'POST', body: { email: user.email, password: user.password } });
assert(r.status === 200, 're-login works');
const accessToken2 = r.json.data.accessToken;

console.log('\n== Forgot password ==');
logs = await captureLogs(() => request('/api/auth/forgot-password', { method: 'POST', body: { email: user.email } }));
const resetToken = logs.match(/reset-password\?token=([a-f0-9]+)/)?.[1];
assert(Boolean(resetToken), 'reset token logged in dev mode');
r = await request('/api/auth/forgot-password', { method: 'POST', body: { email: 'nobody@test.dev' } });
assert(r.status === 200, 'forgot-password for unknown email still 200 (no user enumeration)');

console.log('\n== Reset password ==');
r = await request('/api/auth/reset-password', { method: 'POST', body: { token: resetToken, password: 'newpassword123' } });
assert(r.status === 200, `reset-password returns 200 (got ${r.status})`);
r = await request('/api/auth/login', { method: 'POST', body: { email: user.email, password: 'newpassword123' } });
assert(r.status === 200, 'login with new password works');
r = await request('/api/auth/login', { method: 'POST', body: { email: user.email, password: 'supersecret123' } });
assert(r.status === 401, 'old password no longer works');

console.log('\n== Change password ==');
r = await request('/api/auth/change-password', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken2}` },
  body: { currentPassword: 'newpassword123', newPassword: 'finalpass456' },
});
assert(r.status === 200, `change-password returns 200 (got ${r.status})`);
r = await request('/api/auth/login', { method: 'POST', body: { email: user.email, password: 'finalpass456' } });
assert(r.status === 200, 'login with changed password works');

console.log('\n== Google login ==');
const realFetch = globalThis.fetch;
const googleProfile = { sub: 'google-id-1', email: user.email, email_verified: 'true', name: 'Ada Google', picture: 'https://example.com/pic.png' };
globalThis.fetch = async (url, init) =>
  String(url).startsWith('https://oauth2.googleapis.com')
    ? { ok: true, json: async () => googleProfile }
    : realFetch(url, init);
try {
  r = await request('/api/auth/google', { method: 'POST', body: { credential: 'fake-credential' } });
} finally {
  globalThis.fetch = realFetch;
}
assert(r.status === 200, `google links existing account (got ${r.status})`);
assert(r.json.data.user.emailVerified === true, 'existing user linked + verified');
const googleUser = await (await import('../src/models/user.model.js')).default.findOne({ email: user.email });
assert(googleUser.googleId === 'google-id-1', 'googleId stored on linked account');

const newGoogleProfile = { sub: 'google-id-2', email: 'new-google@test.dev', email_verified: true, name: 'New Google', picture: 'https://example.com/pic2.png' };
globalThis.fetch = async (url, init) =>
  String(url).startsWith('https://oauth2.googleapis.com')
    ? { ok: true, json: async () => newGoogleProfile }
    : realFetch(url, init);
try {
  r = await request('/api/auth/google', { method: 'POST', body: { credential: 'fake-credential-2' } });
} finally {
  globalThis.fetch = realFetch;
}
assert(r.status === 201, `google creates new user (got ${r.status})`);

console.log('\n== Logout all ==');
r = await request('/api/auth/logout-all', { method: 'POST', headers: { Authorization: `Bearer ${accessToken2}` } });
assert(r.status === 200, `logout-all returns 200 (got ${r.status})`);
r = await request('/api/auth/refresh', { method: 'POST' });
assert(r.status === 401, `refresh after logout-all fails (got ${r.status})`);

console.log('\n== 404 handler ==');
r = await request('/api/does-not-exist');
assert(r.status === 404, `unknown route returns 404 (got ${r.status})`);

await mongoose.connection.dropDatabase();
await mongoose.disconnect();
server.close();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
