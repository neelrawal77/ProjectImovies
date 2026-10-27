import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupDb, teardownDb, loadApp, userAgent, adminAgent, movieBody, theatreBody, futureDateTime } from './helpers.js';

let app; let admin; let user;
let ok = false;
before(async () => { ok = await setupDb(); if (ok) { app = await loadApp(); admin = await adminAgent(app); user = await userAgent(app, 1); } });
after(teardownDb);
const t = (name, fn) => test(name, async (c) => { if (!ok) return c.skip('MongoDB not reachable'); return fn(c); });

t('movie CRUD (admin) with public read, search and genre filter', async () => {
  const created = await admin.post('/api/movies').send(movieBody({ name: 'Alpha Film', genres: ['Comedy'] }));
  assert.equal(created.status, 201);
  const id = created.body.data._id;
  await admin.post('/api/movies').send(movieBody({ name: 'Beta Film', genres: ['Horror'] }));

  assert.equal((await request(app).get(`/api/movies/${id}`)).body.data.name, 'Alpha Film');
  assert.equal((await request(app).get('/api/movies?search=alp')).body.data.length, 1);
  assert.equal((await request(app).get('/api/movies?genre=horror')).body.data[0].name, 'Beta Film');
  assert.equal((await request(app).get('/api/movies?search=.*')).body.data.length, 0); // regex is escaped
  assert.deepEqual((await request(app).get('/api/movies/genres')).body.data, ['Comedy', 'Horror']);

  const upd = await admin.put(`/api/movies/${id}`).send({ duration: 111 });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.data.duration, 111);

  assert.equal((await user.post('/api/movies').send(movieBody())).status, 403);
  assert.equal((await admin.post('/api/movies').send({ name: 'x' })).status, 400);
  assert.equal((await request(app).get('/api/movies/not-an-id')).status, 400);
  assert.equal((await request(app).get('/api/movies/507f1f77bcf86cd799439011')).status, 404);

  assert.equal((await admin.delete(`/api/movies/${id}`)).status, 200);
  assert.equal((await request(app).get(`/api/movies/${id}`)).status, 404);
});

t('theatre CRUD with unique identifier and validation', async () => {
  const created = await admin.post('/api/theatres').send(theatreBody({ theatreCode: 'th-a' }));
  assert.equal(created.status, 201);
  assert.equal(created.body.data.theatreCode, 'TH-A');
  assert.equal(created.body.data.totalSeats, 20);
  const id = created.body.data._id;
  assert.equal((await admin.post('/api/theatres').send(theatreBody({ theatreCode: 'TH-A' }))).status, 409);
  assert.equal((await admin.post('/api/theatres').send(theatreBody({ theatreCode: 'TH-B', sections: [{ name: 'X', rows: 40, seatsPerRow: 5, price: 100 }] }))).status, 400);
  assert.equal((await request(app).get('/api/theatres')).body.data.length >= 1, true);
  assert.equal((await admin.put(`/api/theatres/${id}`).send({ name: 'Renamed' })).body.data.name, 'Renamed');
  assert.equal((await user.delete(`/api/theatres/${id}`)).status, 403);
  assert.equal((await admin.delete(`/api/theatres/${id}`)).status, 200);
});

t('show CRUD: snapshot of seats, clash detection, deletion guards', async () => {
  const movie = (await admin.post('/api/movies').send(movieBody({ name: 'Show Movie' }))).body.data;
  const theatre = (await admin.post('/api/theatres').send(theatreBody({ theatreCode: 'SH-1' }))).body.data;
  const when = futureDateTime(2, '20:00');

  const created = await admin.post('/api/shows').send({ movie: movie._id, theatre: theatre._id, ...when });
  assert.equal(created.status, 201);
  const id = created.body.data._id;
  assert.equal(created.body.data.availableSeats, 20);

  assert.equal((await admin.post('/api/shows').send({ movie: movie._id, theatre: theatre._id, ...when })).status, 409); // same slot
  assert.equal((await admin.post('/api/shows').send({ movie: movie._id, theatre: theatre._id, date: '2020-01-01', time: '10:00' })).status, 400); // past
  assert.equal((await user.post('/api/shows').send({ movie: movie._id, theatre: theatre._id, ...when })).status, 403);

  const detail = await request(app).get(`/api/shows/${id}`);
  assert.equal(detail.body.data.seats.length, 20);
  assert.equal(detail.body.data.seats[0].id, 'A1');
  assert.equal((await request(app).get(`/api/shows/movie/${movie._id}`)).body.data.length, 1);
  assert.equal((await request(app).get(`/api/shows?movie=${movie._id}`)).body.data.length, 1);

  assert.equal((await admin.put(`/api/shows/${id}`).send({ time: '21:00' })).body.data.time, '21:00');

  // movie / theatre cannot be deleted while a show uses them
  assert.equal((await admin.delete(`/api/movies/${movie._id}`)).status, 409);
  assert.equal((await admin.delete(`/api/theatres/${theatre._id}`)).status, 409);
  assert.equal((await admin.delete(`/api/shows/${id}`)).status, 200);
  assert.equal((await admin.delete(`/api/movies/${movie._id}`)).status, 200);
});
