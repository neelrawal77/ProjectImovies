import dotenv from 'dotenv';

dotenv.config();

// Read lazily (getters) so tests can set variables before first use.
export const config = {
  get port() { return Number(process.env.PORT) || 8000; },
  get mongoUri() { return process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Imovies'; },
  get jwtSecret() { return process.env.JWT_SECRET; },
  get clientUrls() {
    return (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean);
  },
  get isProd() { return process.env.NODE_ENV === 'production'; },
  get isTest() { return process.env.NODE_ENV === 'test'; },
  get bcryptRounds() { return Number(process.env.BCRYPT_ROUNDS) || 12; },
  // Users may cancel until this many hours before the show starts.
  get cancelCutoffHours() { return Number(process.env.CANCELLATION_CUTOFF_HOURS) || 2; },
  maxSeatsPerBooking: 10,
};

export function assertConfig() {
  const s = config.jwtSecret;
  if (!s || s.length < 16 || s.startsWith('replace_with')) {
    throw new Error(
      'JWT_SECRET is missing or still the placeholder. Set a long random value in server/.env ' +
        '(generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))").'
    );
  }
}
