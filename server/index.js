import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import { config, assertConfig } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

try {
  assertConfig();
} catch (err) {
  console.error(`✖ ${err.message}`);
  process.exit(1);
}

const server = app.listen(config.port, () => {
  console.log(`IMovies API listening on http://localhost:${config.port}  (health: /api/health)`);
});
server.on('error', (err) => {
  console.error(`✖ Could not start the server: ${err.message}`);
  process.exit(1);
});

// Database-dependent routes answer 503 until MongoDB is connected; we keep retrying.
async function connectWithRetry(attempt = 1) {
  try {
    await connectDB();
  } catch (err) {
    console.error(`✖ MongoDB connection failed (attempt ${attempt}): ${err.message}`);
    console.error('  Is MongoDB running? Check MONGO_URI in server/.env. Retrying in 5s…');
    setTimeout(() => connectWithRetry(attempt + 1), 5000);
  }
}
connectWithRetry();

mongoose.connection.on('disconnected', () => console.warn('! MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('✔ MongoDB reconnected'));

const shutdown = () => server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
