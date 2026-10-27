import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupDb, teardownDb, loadApp, userAgent, adminAgent, movieBody } from './helpers.js';

let app; let admin; let movie;
let ok = false;
before(async () => {
  ok = await setupDb();
  if (ok) { app = await loadApp(); admin = await adminAgent(app); movie = (await admin.post('/api/movies').send(movieBody())).body.data; }
});
after(teardownDb);
const t = (name, fn) => test(name, async (c) => { if (!ok) return c.skip('MongoDB not reachable'); return fn(c); });

t('favorites: add (idempotent), list, ids, remove; login required', async () => {
  assert.equal((await request(app).get('/api/favorites')).status, 401);
  const user = await userAgent(app, 1);
  assert.equal((await user.post('/api/favorites').send({ movieId: movie._id })).status, 201);
  assert.equal((await user.post('/api/favorites').send({ movieId: movie._id })).status, 201); // no duplicate
  const list = await user.get('/api/favorites');
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].movie.name, 'Test Movie');
  assert.deepEqual((await user.get('/api/favorites/ids')).body.data, [movie._id]);
  assert.equal((await user.post('/api/favorites').send({ movieId: '507f1f77bcf86cd799439011' })).status, 404);
  assert.equal((await user.delete(`/api/favorites/${movie._id}`)).status, 200);
  assert.equal((await user.get('/api/favorites')).body.data.length, 0);
});

t('reviews: create, one per user, edit own, ratings aggregate, delete rules', async () => {
  const a = await userAgent(app, 2);
  const b = await userAgent(app, 3);
  const created = await a.post('/api/reviews').send({ movieId: movie._id, rating: 5, text: 'Great demo' });
  assert.equal(created.status, 201);
  const rid = created.body.data._id;
  assert.equal((await a.post('/api/reviews').send({ movieId: movie._id, rating: 4 })).status, 409);
  assert.equal((await b.post('/api/reviews').send({ movieId: movie._id, rating: 6 })).status, 400);
  assert.equal((await b.post('/api/reviews').send({ movieId: movie._id, rating: 3 })).status, 201);

  const movieRes = await request(app).get(`/api/movies/${movie._id}`);
  assert.equal(movieRes.body.data.rating, 4);
  assert.equal(movieRes.body.data.reviewCount, 2);
  assert.equal((await request(app).get(`/api/reviews/movie/${movie._id}`)).body.data.length, 2);

  assert.equal((await b.put(`/api/reviews/${rid}`).send({ rating: 1 })).status, 403); // not the owner
  const edited = await a.put(`/api/reviews/${rid}`).send({ rating: 4, text: 'Edited' });
  assert.equal(edited.body.data.text, 'Edited');
  assert.equal((await b.delete(`/api/reviews/${rid}`)).status, 403);
  assert.equal((await admin.delete(`/api/reviews/${rid}`)).status, 200); // admins may moderate
  assert.equal((await a.get('/api/reviews/my')).body.data.length, 0);
});
