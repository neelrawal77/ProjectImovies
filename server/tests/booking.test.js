import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupDb, teardownDb, loadApp, userAgent, adminAgent, makeShow } from './helpers.js';

let app; let admin;
let ok = false;
before(async () => { ok = await setupDb(); if (ok) { app = await loadApp(); admin = await adminAgent(app); } });
after(teardownDb);
const t = (name, fn) => test(name, async (c) => { if (!ok) return c.skip('MongoDB not reachable'); return fn(c); });

t('booking prices on the server, confirms with demo payment and updates inventory', async () => {
  const { show } = await makeShow(admin, { code: 'B-1', time: '10:00' });
  const user = await userAgent(app, 1);
  const res = await user.post('/api/bookings').send({ showId: show._id, seats: ['A1', 'A2', 'C1'], totalAmount: 1 /* ignored */ });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.totalAmount, 300 + 300 + 200);
  assert.equal(res.body.data.status, 'confirmed');
  assert.equal(res.body.data.paymentStatus, 'paid');
  assert.match(res.body.data.bookingId, /^IM-[A-Z0-9]+$/);

  const detail = (await request(app).get(`/api/shows/${show._id}`)).body.data;
  assert.equal(detail.availableSeats, 17);
  assert.equal(detail.seats.find((s) => s.id === 'A1').booked, true);

  const mine = await user.get('/api/bookings/my');
  assert.equal(mine.body.data.length, 1);
  assert.equal((await user.get(`/api/bookings/${res.body.data._id}`)).status, 200);
});

t('a seat cannot be booked twice (sequential and concurrent)', async () => {
  const { show } = await makeShow(admin, { code: 'B-2', time: '12:00' });
  const first = await userAgent(app, 2);
  assert.equal((await first.post('/api/bookings').send({ showId: show._id, seats: ['B1'] })).status, 201);
  const second = await userAgent(app, 3);
  const dup = await second.post('/api/bookings').send({ showId: show._id, seats: ['B1', 'B2'] });
  assert.equal(dup.status, 409);
  // the failed attempt must not have taken B2
  assert.equal((await request(app).get(`/api/shows/${show._id}`)).body.data.seats.find((s) => s.id === 'B2').booked, false);

  // 6 users race for the very same seat: exactly one wins
  const racers = await Promise.all([10, 11, 12, 13, 14, 15].map((n) => userAgent(app, n)));
  const results = await Promise.all(racers.map((a) => a.post('/api/bookings').send({ showId: show._id, seats: ['D5'] })));
  const statuses = results.map((r) => r.status).sort();
  assert.equal(statuses.filter((s) => s === 201).length, 1, `statuses: ${statuses}`);
  assert.equal(statuses.filter((s) => s === 409).length, 5);
  const booked = (await request(app).get(`/api/shows/${show._id}`)).body.data.bookedSeats.filter((s) => s === 'D5');
  assert.equal(booked.length, 1);
});

t('booking input is validated (bad ids, unknown seats, too many, unauthenticated)', async () => {
  const { show } = await makeShow(admin, { code: 'B-3', time: '14:00' });
  const user = await userAgent(app, 20);
  assert.equal((await request(app).post('/api/bookings').send({ showId: show._id, seats: ['A1'] })).status, 401);
  assert.equal((await user.post('/api/bookings').send({ showId: 'bad', seats: ['A1'] })).status, 400);
  assert.equal((await user.post('/api/bookings').send({ showId: show._id, seats: [] })).status, 400);
  assert.equal((await user.post('/api/bookings').send({ showId: show._id, seats: ['Z99'] })).status, 400);
  const eleven = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1'];
  assert.equal((await user.post('/api/bookings').send({ showId: show._id, seats: eleven })).status, 400);
});

t('demo payment failure releases the seats and marks the booking failed', async () => {
  const { show } = await makeShow(admin, { code: 'B-4', time: '16:00' });
  const user = await userAgent(app, 21);
  const res = await user.post('/api/bookings').send({ showId: show._id, seats: ['A3'], demoPaymentOutcome: 'failure' });
  assert.equal(res.status, 402);
  assert.equal(res.body.data.status, 'payment_failed');
  assert.equal(res.body.data.paymentStatus, 'failed');
  assert.equal((await request(app).get(`/api/shows/${show._id}`)).body.data.availableSeats, 20);
  // the seat is free again
  assert.equal((await user.post('/api/bookings').send({ showId: show._id, seats: ['A3'] })).status, 201);
});

t('cancellation releases seats, is owner-only, single-use and obeys the cut-off', async () => {
  const { show } = await makeShow(admin, { code: 'B-5', time: '18:00' });
  const owner = await userAgent(app, 30);
  const other = await userAgent(app, 31);
  const b = (await owner.post('/api/bookings').send({ showId: show._id, seats: ['A4', 'A5'] })).body.data;

  assert.equal((await other.patch(`/api/bookings/${b._id}/cancel`)).status, 404); // not theirs
  assert.equal((await other.get(`/api/bookings/${b._id}`)).status, 404);
  const cancelled = await owner.patch(`/api/bookings/${b._id}/cancel`);
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.data.status, 'cancelled');
  assert.equal(cancelled.body.data.paymentStatus, 'refunded');
  assert.equal((await request(app).get(`/api/shows/${show._id}`)).body.data.availableSeats, 20);
  assert.equal((await owner.patch(`/api/bookings/${b._id}/cancel`)).status, 400); // already cancelled

  // inside the 2-hour window users cannot cancel, but admins can
  const Show = (await import('../models/showModel.js')).default;
  const soon = (await owner.post('/api/bookings').send({ showId: show._id, seats: ['B1'] })).body.data;
  await Show.updateOne({ _id: show._id }, { startsAt: new Date(Date.now() + 30 * 60 * 1000) });
  const late = await owner.patch(`/api/bookings/${soon._id}/cancel`);
  assert.equal(late.status, 400);
  assert.match(late.body.message, /hours before/);
  assert.equal((await admin.patch(`/api/admin/bookings/${soon._id}/cancel`)).status, 200);
  assert.equal((await owner.patch(`/api/admin/bookings/${soon._id}/cancel`)).status, 403);
});

t('admin can list all bookings; users cannot; deleting a show is blocked by confirmed bookings', async () => {
  const { show } = await makeShow(admin, { code: 'B-6', time: '20:00' });
  const user = await userAgent(app, 40);
  await user.post('/api/bookings').send({ showId: show._id, seats: ['A1'] });
  const all = await admin.get('/api/bookings/admin/all?status=confirmed');
  assert.equal(all.status, 200);
  assert.ok(all.body.data.length >= 1);
  assert.equal((await user.get('/api/bookings/admin/all')).status, 403);
  assert.equal((await admin.delete(`/api/shows/${show._id}`)).status, 409);
});
