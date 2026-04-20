const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const dbPath = path.join(os.tmpdir(), `hotel-promenade-chat-fallback-${Date.now()}.db`);

process.env.JWT_SECRET = 'hotel-promenade-chat-fallback-secret-123456789';
process.env.DB_PATH = dbPath;
process.env.BOOTSTRAP_ADMIN_EMAIL = 'admin@lapromenade.com';
process.env.BOOTSTRAP_ADMIN_PASSWORD = 'AdminFallbackPass123!';
process.env.ENABLE_DEMO_USERS = 'false';
process.env.GEMINI_API_KEY = '';
process.env.GROQ_API_KEY = '';

const { startServer, db } = require('../server.js');

let listener;
let baseUrl;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  return { response, body };
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
  baseUrl = `http://127.0.0.1:${listener.address().port}`;
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

test('chat falls back to automation without exposing quota or timeout language', async () => {
  const token = await login('admin@lapromenade.com', 'AdminFallbackPass123!');

  const result = await api('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Resume mes notifications recentes' }]
    })
  });

  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.match(result.body.reply, /Mode automatique|Mode concierge de secours/i);
  assert.doesNotMatch(result.body.reply, /token|timeout|trop de temps|rate limit/i);
});

test('chat returns a graceful rescue reply for non-automatable requests when providers are unavailable', async () => {
  const token = await login('admin@lapromenade.com', 'AdminFallbackPass123!');

  const result = await api('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Raconte moi simplement l atmosphere ideale d un grand hotel' }]
    })
  });

  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.match(result.body.reply, /Mode concierge de secours active/i);
  assert.doesNotMatch(result.body.reply, /token|timeout|trop de temps|rate limit/i);
});
