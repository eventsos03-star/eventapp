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
process.env.GOOGLE_CLIENT_ID = '';

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
assert(r.status === 200, `verify-email activates account (got ${r.status})`);
r = await request(`/api/auth/verify-email?token=${verifyToken}`);
assert(r.status === 200 && r.json.data.emailVerified === true, `verify-email replay is idempotent (got ${r.status})`);

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
// The backend verifies Google ID tokens locally with google-auth-library, so
// stub verifyIdToken with the profile keyed by the fake credential.
const { OAuth2Client } = await import('google-auth-library');
const originalVerifyIdToken = OAuth2Client.prototype.verifyIdToken;
const googleProfiles = {
  'fake-credential': {
    sub: 'google-id-1',
    email: user.email,
    email_verified: 'true',
    name: 'Ada Google',
    picture: 'https://example.com/pic.png',
  },
  'fake-credential-2': {
    sub: 'google-id-2',
    email: 'new-google@test.dev',
    email_verified: true,
    name: 'New Google',
    picture: 'https://example.com/pic2.png',
  },
};
OAuth2Client.prototype.verifyIdToken = async function ({ idToken }) {
  const payload = googleProfiles[idToken];
  if (!payload) throw new Error(`Invalid Google token: ${idToken}`);
  return { getPayload: () => payload };
};
try {
  r = await request('/api/auth/google', { method: 'POST', body: { credential: 'fake-credential' } });
  assert(r.status === 200, `google links existing account (got ${r.status})`);
  assert(r.json.data.isNewUser === false, 'google existing account: isNewUser=false');
  assert(r.json.data.user.emailVerified === true, 'existing user linked + verified');
  const googleUser = await (await import('../src/modules/auth/user.model.js')).default.findOne({ email: user.email });
  assert(googleUser.googleId === 'google-id-1', 'googleId stored on linked account');

  r = await request('/api/auth/google', { method: 'POST', body: { credential: 'fake-credential-2' } });
  assert(r.status === 201, `google creates new user (got ${r.status})`);
  assert(r.json.data.isNewUser === true, 'google new user: isNewUser=true');
} finally {
  OAuth2Client.prototype.verifyIdToken = originalVerifyIdToken;
}
const googleAccessToken = r.json.data.accessToken;

console.log('\n== Update profile ==');
r = await request('/api/auth/me', {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${googleAccessToken}` },
  body: { firstName: 'New', lastName: 'GoogleName' },
});
assert(r.status === 200, `PATCH /auth/me returns 200 (got ${r.status})`);
assert(r.json.data.firstName === 'New' && r.json.data.lastName === 'GoogleName', 'profile fields updated');
r = await request('/api/auth/me', { headers: { Authorization: `Bearer ${googleAccessToken}` } });
assert(r.status === 200 && r.json.data.firstName === 'New', 'updated name persists via me');

console.log('\n== Change password (google user) ==');
r = await request('/api/auth/change-password', {
  method: 'POST',
  headers: { Authorization: `Bearer ${googleAccessToken}` },
  body: { currentPassword: 'whatever123', newPassword: 'newpassword123' },
});
assert(r.status === 400, `google user change-password blocked with 400 (got ${r.status})`);

console.log('\n== Update profile validation ==');
r = await request('/api/auth/me', {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${googleAccessToken}` },
  body: {},
});
assert(r.status === 400, `empty profile update rejected (got ${r.status})`);

console.log('\n== Logout all ==');
r = await request('/api/auth/logout-all', { method: 'POST', headers: { Authorization: `Bearer ${accessToken2}` } });
assert(r.status === 200, `logout-all returns 200 (got ${r.status})`);
r = await request('/api/auth/refresh', { method: 'POST' });
assert(r.status === 401, `refresh after logout-all fails (got ${r.status})`);

console.log('\n== 404 handler ==');
r = await request('/api/does-not-exist');
assert(r.status === 404, `unknown route returns 404 (got ${r.status})`);

console.log('\n== Admin access control ==');
r = await request('/api/auth/login', { method: 'POST', body: { email: 'ada@test.dev', password: 'finalpass456' } });
const userToken = r.json.data.accessToken;
r = await request('/api/admin/stats');
assert(r.status === 401, `anonymous blocked from /admin/stats (got ${r.status})`);
r = await request('/api/admin/stats', { headers: { Authorization: `Bearer ${userToken}` } });
assert(r.status === 403, `regular user blocked from /admin/stats (got ${r.status})`);

console.log('\n== Seed admin + pending resources ==');
const { default: UserModel } = await import('../src/modules/auth/user.model.js');
const { default: OrganizationModel } = await import('../src/modules/organization/organization.model.js');
const { default: VenueModel } = await import('../src/modules/venue/venue.model.js');

const owner = await UserModel.create({
  firstName: 'Venue',
  lastName: 'Owner',
  email: 'owner@test.dev',
  password: 'ownerpass123',
  role: 'USER',
  status: 'ACTIVE',
  emailVerified: true,
});
await UserModel.create({
  firstName: 'Root',
  lastName: 'Admin',
  email: 'root@test.dev',
  password: 'adminpass123',
  role: 'ADMIN',
  status: 'ACTIVE',
  emailVerified: true,
});
await OrganizationModel.create({
  organizationName: 'Pending Org',
  description: 'desc',
  email: 'org@test.dev',
  address: '1 Main St',
  ownerId: owner._id,
  status: 'pending',
});
await OrganizationModel.create({
  organizationName: 'Approved Org',
  email: 'org2@test.dev',
  address: '2 Main St',
  ownerId: owner._id,
  status: 'approved',
});
await VenueModel.create({
  ownerId: owner._id,
  venueName: 'Hall A',
  description: 'desc',
  images: [{ url: 'https://example.com/a.png', publicId: 'a' }],
  location: { address: '1 Main St', city: 'City', state: 'State' },
  capacity: 100,
  pricePerDay: 500,
  bookingPaymentPolicy: 'fullpayment',
  status: 'pending',
});

r = await request('/api/auth/login', { method: 'POST', body: { email: 'root@test.dev', password: 'adminpass123' } });
assert(r.status === 200, `admin login works (got ${r.status})`);
const adminToken = r.json.data.accessToken;

console.log('\n== Admin stats ==');
r = await request('/api/admin/stats', { headers: { Authorization: `Bearer ${adminToken}` } });
assert(r.status === 200, `admin stats returns 200 (got ${r.status})`);
assert(r.json.data.totalOrganizations === 2, 'stats counts total organizations');
assert(r.json.data.pendingOrganizations === 1, 'stats counts pending organizations');
assert(r.json.data.totalVenueOwners === 1, 'stats counts venue owners');
assert(r.json.data.pendingVenueOwners === 1, 'stats counts pending venue owners');

console.log('\n== List + approve organizations ==');
r = await request('/api/admin/organizations?status=pending', { headers: { Authorization: `Bearer ${adminToken}` } });
assert(r.status === 200 && r.json.data.length === 1, 'lists pending organizations');
const orgId = r.json.data[0].id;
r = await request(`/api/admin/organizations/${orgId}/approve`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
assert(r.status === 200 && r.json.data.status === 'approved', `org approved (got ${r.status})`);
r = await request(`/api/admin/organizations/${orgId}/approve`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
assert(r.status === 400, 're-approving an approved org blocked');

console.log('\n== Reject (only pending actionable) ==');
r = await request('/api/admin/organizations?status=approved', { headers: { Authorization: `Bearer ${adminToken}` } });
const approvedOrgId = r.json.data[0].id;
r = await request(`/api/admin/organizations/${approvedOrgId}/reject`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
assert(r.status === 400, 'rejecting a non-pending org blocked');

console.log('\n== List + approve venue owners ==');
r = await request('/api/admin/venue-owners?status=pending', { headers: { Authorization: `Bearer ${adminToken}` } });
assert(r.status === 200 && r.json.data.length === 1, 'lists pending venue owners');
const ownerId = r.json.data[0].ownerId;
r = await request(`/api/admin/venue-owners/${ownerId}/approve`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
assert(r.status === 200 && r.json.data.venues[0].status === 'approved', `venue owner approved (got ${r.status})`);
r = await request(`/api/admin/venue-owners/${ownerId}/approve`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
assert(r.status === 400, 'approving an owner with no pending venues blocked');

console.log('\n== Admin validation ==');
r = await request('/api/admin/organizations/abc/approve', { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
assert(r.status === 400, 'invalid organization id rejected');
r = await request('/api/admin/organizations?status=bogus', { headers: { Authorization: `Bearer ${adminToken}` } });
assert(r.status === 400, 'invalid status rejected');

await mongoose.connection.dropDatabase();
await mongoose.disconnect();
server.close();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
