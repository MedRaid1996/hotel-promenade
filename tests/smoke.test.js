const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const dbPath = path.join(os.tmpdir(), `hotel-promenade-test-${Date.now()}.db`);
process.env.JWT_SECRET = 'hotel-promenade-test-secret-123456789';
process.env.DB_PATH = dbPath;
process.env.BOOTSTRAP_ADMIN_EMAIL = 'admin@lapromenade.com';
process.env.BOOTSTRAP_ADMIN_PASSWORD = 'AdminTestPass123!';
process.env.ENABLE_DEMO_USERS = 'false';

const { startServer, db } = require('../server.js');

let listener;
let baseUrl;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function futureDate(days = 45) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function pastDate(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

async function api(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  return { response, body };
}

async function registerUser(user) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const result = await api('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (result.response.status === 201) return result.body;
    if (result.response.status !== 503) {
      assert.equal(result.response.status, 201, `Registration failed: ${JSON.stringify(result.body)}`);
    }
    await wait(250);
  }

  const { body, response } = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  assert.equal(response.status, 201, `Registration failed: ${JSON.stringify(body)}`);
  return body;
}

async function login(email, password) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const result = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (result.response.status === 200) return result.body.token;
    if (result.response.status !== 503) {
      assert.equal(result.response.status, 200, `Login failed: ${JSON.stringify(result.body)}`);
    }
    await wait(250);
  }

  const { body, response } = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert.equal(response.status, 200, `Login failed: ${JSON.stringify(body)}`);
  return body.token;
}

test.before(async () => {
  listener = startServer(0);
  await wait(1200);
  const address = listener.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise((resolve) => listener.close(resolve));
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  fs.rmSync(dbPath, { force: true });
});

test('self-registration cannot mint privileged roles', async () => {
  const result = await registerUser({
    fname: 'Alice',
    lname: 'Secure',
    email: 'alice@example.com',
    password: 'VerySecurePass123!',
    role: 'admin'
  });

  assert.equal(result.user.role, 'organisateur');
});

test('users cannot access another organizer event detail', async () => {
  await registerUser({
    fname: 'Owner',
    lname: 'One',
    email: 'owner@example.com',
    password: 'OwnerPass123!'
  });
  await registerUser({
    fname: 'Visitor',
    lname: 'Two',
    email: 'visitor@example.com',
    password: 'VisitorPass123!'
  });

  const ownerToken = await login('owner@example.com', 'OwnerPass123!');
  const visitorToken = await login('visitor@example.com', 'VisitorPass123!');

  const created = await api('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'Salon Signature',
      type: 'Conférence',
      date: futureDate(45),
      time: '10:00'
    })
  });
  assert.equal(created.response.status, 201, JSON.stringify(created.body));

  const denied = await api(`/api/events/${created.body.id}`, {
    headers: { 'Authorization': `Bearer ${visitorToken}` }
  });
  assert.equal(denied.response.status, 403);
});

test('date and room reservation rules are enforced', async () => {
  const adminToken = await login('admin@lapromenade.com', 'AdminTestPass123!');
  const roomList = await api('/api/rooms', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.equal(roomList.response.status, 200);
  const roomId = roomList.body.rooms[0].id;
  const bookingDate = futureDate(90);

  const pastEvent = await api('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Impossible Past Event',
      date: pastDate(),
      time: '09:00'
    })
  });
  assert.equal(pastEvent.response.status, 400);

  const pastReservation = await api('/api/rooms/reserve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      roomId,
      date: pastDate(),
      startTime: '09:00',
      endTime: '10:00'
    })
  });
  assert.equal(pastReservation.response.status, 400);

  const firstReservation = await api('/api/rooms/reserve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      roomId,
      date: bookingDate,
      startTime: '10:00',
      endTime: '12:00'
    })
  });
  assert.equal(firstReservation.response.status, 201, JSON.stringify(firstReservation.body));

  const overlappingReservation = await api('/api/rooms/reserve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      roomId,
      date: bookingDate,
      startTime: '11:00',
      endTime: '13:00'
    })
  });
  assert.equal(overlappingReservation.response.status, 409);
});

test('payments and reports are scoped to the owner', async () => {
  await registerUser({
    fname: 'Finance',
    lname: 'Owner',
    email: 'finance-owner@example.com',
    password: 'FinanceOwner123!'
  });
  await registerUser({
    fname: 'Finance',
    lname: 'Other',
    email: 'finance-other@example.com',
    password: 'FinanceOther123!'
  });

  const ownerToken = await login('finance-owner@example.com', 'FinanceOwner123!');
  const otherToken = await login('finance-other@example.com', 'FinanceOther123!');

  const eventResult = await api('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'Gala Privé',
      type: 'Gala',
      date: futureDate(60),
      time: '18:00'
    })
  });
  assert.equal(eventResult.response.status, 201, JSON.stringify(eventResult.body));

  const invoiceResult = await api(`/api/invoices/generate/${eventResult.body.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ client: 'Client Test' })
  });
  assert.equal(invoiceResult.response.status, 201, JSON.stringify(invoiceResult.body));

  const payResult = await api(`/api/invoices/${invoiceResult.body.id}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ method: 'Carte' })
  });
  assert.equal(payResult.response.status, 200, JSON.stringify(payResult.body));

  const ownerPayments = await api('/api/payments', {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  assert.equal(ownerPayments.response.status, 200);
  assert.equal(ownerPayments.body.payments.length, 1);

  const otherPayments = await api('/api/payments', {
    headers: { 'Authorization': `Bearer ${otherToken}` }
  });
  assert.equal(otherPayments.response.status, 200);
  assert.equal(otherPayments.body.payments.length, 0);

  const otherSummary = await api('/api/reports/summary', {
    headers: { 'Authorization': `Bearer ${otherToken}` }
  });
  assert.equal(otherSummary.response.status, 200);
  assert.equal(otherSummary.body.events.total, 0);
  assert.equal(otherSummary.body.revenue.paid, 0);

  const ownerEventsByType = await api('/api/reports/events-by-type', {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  assert.equal(ownerEventsByType.response.status, 200);
  assert.equal(ownerEventsByType.body.data.length, 1);
  assert.equal(ownerEventsByType.body.data[0].type, 'Gala');

  const otherEventsByType = await api('/api/reports/events-by-type', {
    headers: { 'Authorization': `Bearer ${otherToken}` }
  });
  assert.equal(otherEventsByType.response.status, 200);
  assert.equal(otherEventsByType.body.data.length, 0);

  const reportCsv = await api('/api/reports/export.csv', {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  assert.equal(reportCsv.response.status, 200);
  assert.match(reportCsv.body, /Participation/);
  assert.match(reportCsv.body, /Coût final/);
});

test('audit log is admin-only and available to administrators', async () => {
  await registerUser({
    fname: 'Audit',
    lname: 'User',
    email: 'audit-user@example.com',
    password: 'AuditUser123!'
  });

  const adminToken = await login('admin@lapromenade.com', 'AdminTestPass123!');
  const organizerToken = await login('audit-user@example.com', 'AuditUser123!');

  const adminAudit = await api('/api/audit', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.equal(adminAudit.response.status, 200);
  assert.ok(Array.isArray(adminAudit.body.history));
  assert.ok(adminAudit.body.history.length >= 1);

  const forbiddenAudit = await api('/api/audit', {
    headers: { 'Authorization': `Bearer ${organizerToken}` }
  });
  assert.equal(forbiddenAudit.response.status, 403);
});
