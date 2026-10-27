import { describe, it, expect } from 'vitest';
import { validateLogin, validateRegister, validateMovie, validateTheatre, validateShow } from './validators.js';
import { formatINR, formatTime, formatDuration, formatDate } from './format.js';

describe('validators', () => {
  it('login', () => {
    expect(validateLogin({ email: 'a@b.co', password: 'x' })).toEqual({});
    expect(Object.keys(validateLogin({ email: 'nope', password: '' }))).toEqual(['email', 'password']);
  });
  it('register checks length, letter+number and confirmation', () => {
    expect(validateRegister({ username: 'abc', email: 'a@b.co', password: 'Passw0rdX', confirmPassword: 'Passw0rdX' })).toEqual({});
    const e = validateRegister({ username: 'a', email: 'x', password: 'password', confirmPassword: 'other' });
    expect(Object.keys(e)).toEqual(['username', 'email', 'password', 'confirmPassword']);
  });
  it('movie', () => {
    const ok = { name: 'A', description: 'long enough text', genres: ['Drama'], releaseDate: '2026-01-01', duration: 90, language: 'English', posterUrl: '/posters/x.svg' };
    expect(validateMovie(ok)).toEqual({});
    expect(validateMovie({ ...ok, duration: 0, genres: [] })).toHaveProperty('duration');
  });
  it('theatre', () => {
    const ok = { name: 'T', location: 'L', theatreCode: 'T-1', sections: [{ name: 'A', rows: 2, seatsPerRow: 5, price: 100 }] };
    expect(validateTheatre(ok)).toEqual({});
    expect(validateTheatre({ ...ok, sections: [{ name: 'A', rows: 30, seatsPerRow: 5, price: 100 }] })).toHaveProperty('sections');
  });
  it('show rejects past times when creating', () => {
    expect(validateShow({ movie: '1', theatre: '2', date: '2020-01-01', time: '10:00' })).toHaveProperty('time');
    expect(validateShow({ movie: '1', theatre: '2', date: '2020-01-01', time: '10:00' }, { editing: true })).toEqual({});
  });
});

describe('format', () => {
  it('formats money, time and duration', () => {
    expect(formatINR(1200)).toContain('1,200');
    expect(formatTime('18:30')).toBe('6:30 PM');
    expect(formatTime('00:05')).toBe('12:05 AM');
    expect(formatDuration(128)).toBe('2h 08m');
    expect(formatDate('2026-03-05')).toContain('2026');
  });
});
