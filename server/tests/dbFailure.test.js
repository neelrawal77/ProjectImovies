// No database connection is made in this file on purpose.
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import './helpers.js';
import app from '../app.js';

test('health reports the real (disconnected) database state with 503', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 503);
  assert.equal(res.body.success, false);
  assert.equal(res.body.status, 'degraded');
  assert.equal(res.body.database.status, 'disconnected');
});

test('database-dependent routes fail cleanly with 503 JSON when MongoDB is down', async () => {
  const res = await request(app).get('/api/movies');
  assert.equal(res.status, 503);
  assert.match(res.body.message, /database/i);
  assert.equal(res.body.stack, undefined);
});
