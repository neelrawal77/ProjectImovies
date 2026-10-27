import mongoose from 'mongoose';
import { config } from './env.js';

const STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

export const dbStatus = () => STATES[mongoose.connection.readyState] || 'unknown';
export const isDbConnected = () => mongoose.connection.readyState === 1;

/** Connects once. Throws on failure so callers can report it accurately. */
export async function connectDB(uri = config.mongoUri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`✔ MongoDB connected (${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name})`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
