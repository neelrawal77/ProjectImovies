import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import './helpers.js';
import { buildSeats, priceSeats, countSeats } from '../utils/seatLayout.js';
import User from '../models/userModel.js';

const sections = [{ name: 'Premium', rows: 2, seatsPerRow: 3, price: 300 }, { name: 'Standard', rows: 1, seatsPerRow: 3, price: 200 }];

test('seat layout letters rows across sections and counts seats', () => {
  const seats = buildSeats(sections);
  assert.equal(seats.length, 9);
  assert.equal(countSeats(sections), 9);
  assert.equal(seats[0].id, 'A1');
  assert.equal(seats.at(-1).id, 'C3');
  assert.equal(seats.find((s) => s.id === 'C1').section, 'Standard');
});

test('server-side pricing sums per-section prices and flags unknown seats', () => {
  const { total, seats, invalid } = priceSeats(sections, ['A1', 'C2', 'Z9']);
  assert.equal(total, 500);
  assert.equal(seats.length, 2);
  assert.deepEqual(invalid, ['Z9']);
});

test('user model normalises email, never serialises the password and verifies with bcrypt', async () => {
  const user = new User({ username: 'tester', email: 'T@Example.com', password: await bcrypt.hash('Passw0rdX', 4) });
  await user.validate();
  assert.equal(user.email, 't@example.com');
  assert.equal(user.role, 'user');
  assert.equal(await user.comparePassword('Passw0rdX'), true);
  assert.equal(await user.comparePassword('wrong-password'), false);
  assert.equal(user.toJSON().password, undefined);
});
