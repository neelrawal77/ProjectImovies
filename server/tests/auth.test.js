import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupDb, teardownDb, loadApp, userAgent, adminAgent } from './helpers.js';

let app;
let ok = false;
before(async () => { ok = await setupDb(); if (ok) app = await loadApp(); });
after(teardownDb);
const t = (name, fn) => test(name, async (c) => { if (!ok) return c.skip('MongoDB not reachable'); return fn(c); });

t('health is ok when connected', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.database.status, 'connected');
});

t('register creates a plain user, sets an HttpOnly cookie, hides the password', async () => {
  const res = await request(app).post('/api/auth/register')
    .send({ username: 'alice', email: 'alice@example.com', password: 'Passw0rdX', role: 'admin' });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.user.role, 'user'); // role in the body is ignored
  assert.equal(res.body.data.user.password, undefined);
  assert.match(res.headers['set-cookie'][0], /token=.*HttpOnly/i);
  // the stored password is a bcrypt hash, never the plain text
  const User = (await import('../models/userModel.js')).default;
  const stored = await User.findOne({ email: 'alice@example.com' }).select('+password');
  assert.notEqual(stored.password, 'Passw0rdX');
  assert.match(stored.password, /^\$2[aby]\$/);
});

t('register rejects duplicates and weak input', async () => {
  const dup = await request(app).post('/api/auth/register').send({ username: 'alice2', email: 'alice@example.com', password: 'Passw0rdX' });
  assert.equal(dup.status, 409);
  const weak = await request(app).post('/api/auth/register').send({ username: 'ab', email: 'nope', password: 'short' });
  assert.equal(weak.status, 400);
  assert.ok(weak.body.errors.length >= 3);
});

t('login succeeds with right password, fails with wrong one and rejects NoSQL-injection objects', async () => {
  const good = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'Passw0rdX' });
  assert.equal(good.status, 200);
  const bad = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'WrongPass1' });
  assert.equal(bad.status, 401);
  const inj = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
  assert.equal(inj.status, 400);
});

t('/me needs a session; logout clears it', async () => {
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  const agent = await userAgent(app, 7);
  const me = await agent.get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, 'user7@example.com');
  assert.equal((await agent.post('/api/auth/logout')).status, 200);
  assert.equal((await agent.get('/api/auth/me')).status, 401);
});

t('protected and admin-only routes enforce 401 / 403', async () => {
  assert.equal((await request(app).get('/api/bookings/my')).status, 401);
  assert.equal((await request(app).get('/api/admin/stats')).status, 401);
  const user = await userAgent(app, 8);
  assert.equal((await user.get('/api/admin/stats')).status, 403);
  assert.equal((await user.post('/api/movies').send({})).status, 403);
  const admin = await adminAgent(app);
  const stats = await admin.get('/api/admin/stats');
  assert.equal(stats.status, 200);
  assert.ok(stats.body.data.users >= 2);
});

t('tampered / bogus tokens are rejected and unknown routes return JSON 404', async () => {
  const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.token');
  assert.equal(res.status, 401);
  const nf = await request(app).get('/api/does-not-exist');
  assert.equal(nf.status, 404);
  assert.equal(nf.body.success, false);
});
