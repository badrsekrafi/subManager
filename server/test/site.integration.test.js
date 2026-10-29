const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dns = require('node:dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// The application never connects to the production database in this suite.
// Only the uniquely named database created here is removed during cleanup.
const localEnvironment = fs.existsSync(path.join(__dirname, '../.env'))
  ? dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')))
  : {};
const uri = process.env.TEST_MONGODB_URI || localEnvironment.MONGODB_URI;
const databaseName = `submanager_test_${crypto.randomBytes(8).toString('hex')}`;
const password = crypto.randomBytes(18).toString('hex');
let server;
let origin;
let cookie;
let clientId;
let serviceId;

async function request(route, { method = 'GET', body, authenticated = true } = {}) {
  const response = await fetch(`${origin}/api${route}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authenticated && cookie ? { Cookie: cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = await response.json();
  return { status: response.status, json, headers: response.headers };
}

function subscription(overrides = {}) {
  return {
    clientId, serviceId,
    purchaseDate: '2026-10-29T00:00:00.000Z',
    startDate: '2026-10-29T00:00:00.000Z',
    duration: { value: 1, unit: 'months' },
    quantity: 2, unitPrice: 12.345, initialPayment: 0,
    ...overrides,
  };
}

before(async () => {
  assert.ok(uri, 'Set TEST_MONGODB_URI or configure server/.env to run integration tests');
  if (process.platform === 'win32') dns.setServers(['8.8.8.8', '1.1.1.1']);
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  process.env.ADMIN_EMAIL = 'site-test@example.test';
  process.env.ADMIN_INITIAL_PASSWORD = password;
  await mongoose.connect(uri, { dbName: databaseName, serverSelectionTimeoutMS: 15000 });
  assert.equal(mongoose.connection.name, databaseName);
  const app = require('../src/server');
  server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  const login = await request('/auth/login', {
    method: 'POST', authenticated: false,
    body: { email: process.env.ADMIN_EMAIL, password },
  });
  assert.equal(login.status, 200, login.json.message);
  cookie = login.headers.get('set-cookie').split(';')[0];
  const client = await request('/clients', { method: 'POST', body: { firstName: 'QA', lastName: 'Isolated' } });
  assert.equal(client.status, 201, client.json.message);
  clientId = client.json.data._id;
  const service = await request('/services', { method: 'POST', body: { name: 'QA Isolated Service' } });
  assert.equal(service.status, 201, service.json.message);
  serviceId = service.json.data._id;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === databaseName && databaseName.startsWith('submanager_test_')) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

test('creation accepts the numeric duration sent by the deployed add form', async () => {
  const result = await request('/subscriptions', { method: 'POST', body: subscription({ duration: 1 }) });
  assert.equal(result.status, 201, result.json.message);
  assert.equal(result.json.data.subscription.totalPrice, 24.69);
});

test('creation saves a structured duration and calculates expiration and initial payment', async () => {
  const result = await request('/subscriptions', { method: 'POST', body: subscription({ initialPayment: 10, paymentMethod: 'D17' }) });
  assert.equal(result.status, 201, result.json.message);
  assert.equal(result.json.data.subscription.expirationDate, '2026-11-29T00:00:00.000Z');
  assert.equal(result.json.data.subscription.remaining, 14.69);
  assert.equal(result.json.data.payment.paymentMethod, 'D17');
});

test('authentication returns an actual admin profile and protects private routes', async () => {
  const guest = await request('/clients', { authenticated: false });
  assert.equal(guest.status, 401);
  const me = await request('/auth/me');
  assert.equal(me.json.data.admin.email, 'site-test@example.test');
  assert.equal(me.json.data.admin.mustChangePassword, true);
  assert.equal(me.json.data.admin.passwordHash, undefined);
  const profile = await request('/auth/profile', { method: 'PUT', body: { name: 'QA Administrator' } });
  assert.equal(profile.status, 200);
  assert.equal(profile.json.data.admin.name, 'QA Administrator');
  const newEmail = 'updated-site-test@example.test';
  const emailUpdate = await request('/auth/profile', { method: 'PUT', body: { email: newEmail } });
  assert.equal(emailUpdate.status, 200);
  await require('../src/utils/initDefaults')();
  assert.equal(await require('../src/models/Admin').countDocuments(), 1, 'Startup must not recreate an old admin after email changes');
  const restore = await request('/auth/profile', { method: 'PUT', body: { email: process.env.ADMIN_EMAIL } });
  assert.equal(restore.status, 200);
});

test('a zero-price subscription is valid and immediately settled without a payment record', async () => {
  const result = await request('/subscriptions', { method: 'POST', body: subscription({ unitPrice: 0 }) });
  assert.equal(result.status, 201, result.json.message);
  assert.equal(result.json.data.subscription.totalPrice, 0);
  assert.equal(result.json.data.subscription.paymentStatus, 'Payé');
  assert.equal(result.json.data.payment, null);
});

test('invalid subscription inputs never leave a subscription or payment behind', async t => {
  const Subscription = require('../src/models/Subscription');
  const Payment = require('../src/models/Payment');
  const cases = [
    ['overpayment', { initialPayment: 25 }],
    ['negative payment', { initialPayment: -1 }],
    ['non-numeric payment', { initialPayment: 'invalid' }],
    ['invalid method', { initialPayment: 1, paymentMethod: 'invalid' }],
    ['negative price', { unitPrice: -1 }],
    ['non-numeric price', { unitPrice: 'invalid' }],
    ['negative purchase cost', { unitCost: -1 }],
    ['zero quantity', { quantity: 0 }],
    ['fractional quantity', { quantity: 1.5 }],
    ['zero duration', { duration: 0 }],
    ['fractional duration', { duration: 1.5 }],
    ['wrong duration unit', { duration: { value: 1, unit: 'days' } }],
    ['invalid date', { startDate: 'not-a-date' }],
  ];
  for (const [name, input] of cases) await t.test(name, async () => {
    const before = [await Subscription.countDocuments(), await Payment.countDocuments()];
    const result = await request('/subscriptions', { method: 'POST', body: subscription(input) });
    assert.equal(result.status, 400, result.json.message);
    assert.deepEqual([await Subscription.countDocuments(), await Payment.countDocuments()], before);
  });
});

test('payment collection, editing, settlement and debt totals remain consistent', async () => {
  const created = await request('/subscriptions', { method: 'POST', body: subscription({ quantity: 1, unitPrice: 20 }) });
  assert.equal(created.status, 201, created.json.message);
  const id = created.json.data.subscription._id;
  const payment = await request('/payments', { method: 'POST', body: { subscriptionId: id, clientId, amount: 5, paymentMethod: 'D17' } });
  assert.equal(payment.status, 201, payment.json.message);
  const second = await request('/payments', { method: 'POST', body: { subscriptionId: id, clientId, amount: '5', paymentMethod: 'Virement' } });
  assert.equal(second.status, 201, second.json.message);
  const edit = await request(`/payments/${payment.json.data._id}`, { method: 'PUT', body: { amount: '6', paymentMethod: 'Espèces' } });
  assert.equal(edit.status, 200, edit.json.message);
  const duplicate = await request('/payments', { method: 'POST', body: { subscriptionId: id, clientId, amount: '5', paymentMethod: 'Virement' } });
  assert.equal(duplicate.status, 409);
  const detail = await request(`/subscriptions/${id}`);
  assert.equal(detail.json.data.subscription.totalPaid, 11);
  assert.equal(detail.json.data.subscription.remaining, 9);
  const excess = await request('/payments', { method: 'POST', body: { subscriptionId: id, clientId, amount: 10 } });
  assert.equal(excess.status, 400);
  const reduceBill = await request(`/subscriptions/${id}`, { method: 'PUT', body: { unitPrice: 5 } });
  assert.equal(reduceBill.status, 400, 'Reducing a bill below collected payments must be rejected');
  const settle = await request('/payments', { method: 'POST', body: { subscriptionId: id, clientId, amount: 9 } });
  assert.equal(settle.status, 201, settle.json.message);
  const paid = await request(`/subscriptions/${id}`);
  assert.equal(paid.json.data.subscription.remaining, 0);
  assert.equal(paid.json.data.subscription.paymentStatus, 'Payé');
  const unpaid = await request('/dashboard/unpaid');
  assert.equal(unpaid.json.data.subscriptions.some(s => s._id === id), false);
});

test('renewals preserve remaining validity and reject invalid payments before writing', async () => {
  const start = new Date(Date.now() + 5 * 86400000).toISOString();
  const created = await request('/subscriptions', { method: 'POST', body: subscription({ startDate: start }) });
  assert.equal(created.status, 201);
  const original = created.json.data.subscription;
  const renewed = await request(`/subscriptions/${original._id}/renew`, { method: 'POST', body: { duration: 2, startDate: new Date().toISOString(), initialPayment: 5 } });
  assert.equal(renewed.status, 201, renewed.json.message);
  assert.equal(renewed.json.data.subscription.startDate, original.expirationDate);
  assert.equal(renewed.json.data.subscription.renewalOf._id, original._id);
  const invalid = await request(`/subscriptions/${original._id}/renew`, { method: 'POST', body: { duration: 1, initialPayment: 99999 } });
  assert.equal(invalid.status, 400);
  const old = await request('/subscriptions', { method: 'POST', body: subscription({ startDate: '2020-01-31T00:00:00.000Z' }) });
  assert.equal(old.json.data.subscription.expirationDate, '2020-02-29T00:00:00.000Z');
  assert.equal(old.json.data.subscription.status, 'expired');
  const restart = await request(`/subscriptions/${old.json.data.subscription._id}/renew`, { method: 'POST', body: { duration: { value: 1, unit: 'months' } } });
  assert.equal(restart.status, 201, restart.json.message);
  assert.ok(new Date(restart.json.data.subscription.startDate).getTime() >= Date.now() - 30000);
});

test('clients can be searched, edited and archived, including punctuation searches', async () => {
  const punctuation = await request('/clients?search=%5B');
  assert.equal(punctuation.status, 200, punctuation.json.message);
  const client = await request('/clients', { method: 'POST', body: { firstName: 'QA [special]', lastName: 'Archive' } });
  assert.equal(client.status, 201);
  const id = client.json.data._id;
  const search = await request('/clients?search=%5Bspecial%5D');
  assert.equal(search.json.data.length, 1);
  const invalid = await request(`/clients/${id}`, { method: 'PUT', body: { firstName: '' } });
  assert.equal(invalid.status, 400);
  const edit = await request(`/clients/${id}`, { method: 'PUT', body: { phone: 'QA-TEST' } });
  assert.equal(edit.status, 200);
  const archive = await request(`/clients/${id}/archive`, { method: 'PATCH' });
  assert.equal(archive.json.data.archived, true);
  const list = await request('/clients');
  assert.equal(list.json.data.some(c => c._id === id), false);
  const invalidSub = await request('/subscriptions', { method: 'POST', body: subscription({ clientId: id }) });
  assert.equal(invalidSub.status, 400);
  const restore = await request(`/clients/${id}/archive`, { method: 'PATCH' });
  assert.equal(restore.json.data.archived, false);
});

test('client details and client list agree on debt after cancellation', async () => {
  const create = await request('/subscriptions', { method: 'POST', body: subscription({ unitPrice: 10, quantity: 1, initialPayment: 10 }) });
  assert.equal(create.status, 201);
  const cancel = await request(`/subscriptions/${create.json.data.subscription._id}/cancel`, { method: 'PATCH' });
  assert.equal(cancel.status, 200);
  const detail = await request(`/clients/${clientId}`);
  const expectedRemaining = detail.json.data.subscriptions.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + s.remaining, 0);
  assert.equal(detail.json.data.totals.remaining, Math.round(expectedRemaining * 1000) / 1000);
  const list = await request('/clients');
  const client = list.json.data.find(c => c._id === clientId);
  assert.equal(client.remaining, detail.json.data.totals.remaining);
});

test('all dashboard endpoints and filters return populated, consistent data', async () => {
  for (const endpoint of ['/dashboard/stats', '/dashboard/revenue', '/dashboard/service-distribution', '/dashboard/expiring', '/dashboard/recent-payments', '/dashboard/unpaid', '/payments', '/services']) {
    const result = await request(endpoint);
    assert.equal(result.status, 200, `${endpoint}: ${result.json.message}`);
    assert.equal(result.json.success, true);
  }
  const stats = await request('/dashboard/stats');
  const unpaid = await request('/dashboard/unpaid');
  assert.equal(stats.json.data.totalUnpaid, unpaid.json.data.totalRemaining);
  const revenue = await request('/dashboard/revenue');
  assert.equal(revenue.json.data.length, 12);
  const filtered = await request(`/subscriptions?serviceId=${serviceId}&duration=2`);
  assert.ok(filtered.json.data.length > 0);
  assert.ok(filtered.json.data.every(s => s.serviceId._id === serviceId && s.duration.value === 2));
});

test('profile password change and logout work without exposing hashes', async () => {
  const updatedPassword = crypto.randomBytes(18).toString('hex');
  const update = await request('/auth/password', { method: 'PUT', body: { currentPassword: password, newPassword: updatedPassword, confirmPassword: updatedPassword } });
  assert.equal(update.status, 200, update.json.message);
  const me = await request('/auth/me');
  assert.equal(me.json.data.admin.mustChangePassword, false);
  const login = await request('/auth/login', { method: 'POST', body: { email: process.env.ADMIN_EMAIL, password: updatedPassword } });
  assert.equal(login.status, 200, login.json.message);
  const logout = await request('/auth/logout', { method: 'POST' });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /token=;/);
});
