// Shared test helpers. Integration tests need a running MongoDB and skip themselves if none is reachable.
// Set MONGO_URI_TEST to point somewhere else (default: a throw-away database on local MongoDB).
import mongoose from 'mongoose';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-test-secret-test-secret';
process.env.BCRYPT_ROUNDS = '4'; // fast hashing for tests only

const base = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017';
// MONGO_URI_TEST is a base URI WITHOUT a database name; each test process gets its own throw-away database.
const uri = `${base.replace(/\/+$/, '')}/imovies_test_${process.pid}`;

export async function setupDb() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    await mongoose.connection.dropDatabase();
    // make sure unique indexes exist before the tests rely on them
    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
    return true;
  } catch {
    return false;
  }
}

export async function teardownDb() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

export async function loadApp() {
  const app = (await import('../app.js')).default;
  // models are registered by now: make sure every unique index exists before tests rely on it
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  return app;
}

/** Fresh supertest agent (keeps cookies) registered as a normal user. */
export async function userAgent(app, n = 1) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ username: `user${n}`, email: `user${n}@example.com`, password: 'Passw0rdX' });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

/** Agent logged in as an admin (created directly in the DB, as the create-admin script does). */
export async function adminAgent(app) {
  const User = (await import('../models/userModel.js')).default;
  await User.create({ username: 'admin', email: 'admin@example.com', password: 'AdminPass1', role: 'admin' });
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email: 'admin@example.com', password: 'AdminPass1' });
  if (res.status !== 200) throw new Error('admin login failed');
  return agent;
}

export const movieBody = (over = {}) => ({
  name: 'Test Movie', description: 'A movie used only inside the automated tests.', genres: ['Drama'],
  releaseDate: '2026-01-01', duration: 100, language: 'English', certificate: 'U', ...over,
});

export const theatreBody = (over = {}) => ({
  name: 'Test Theatre', location: 'Testville', theatreCode: 'T-1',
  sections: [{ name: 'Premium', rows: 2, seatsPerRow: 5, price: 300 }, { name: 'Standard', rows: 2, seatsPerRow: 5, price: 200 }], ...over,
});

export function futureDateTime(daysAhead = 3, time = '18:30') {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const p = (n) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time };
}

/** Creates movie + theatre + show through the API and returns their ids. */
export async function makeShow(admin, { daysAhead = 3, time = '18:30', code = 'T-1' } = {}) {
  const movie = (await admin.post('/api/movies').send(movieBody({ name: `Movie ${code}-${time}` }))).body.data;
  const theatre = (await admin.post('/api/theatres').send(theatreBody({ theatreCode: code }))).body.data;
  const res = await admin.post('/api/shows').send({ movie: movie._id, theatre: theatre._id, ...futureDateTime(daysAhead, time) });
  if (res.status !== 201) throw new Error(`show create failed ${res.status} ${JSON.stringify(res.body)}`);
  return { movie, theatre, show: res.body.data };
}
