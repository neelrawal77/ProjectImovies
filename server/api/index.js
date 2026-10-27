import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB, isDbConnected } from '../config/db.js';
import { assertConfig } from '../config/env.js';

assertConfig();

let connectionPromise;

async function ensureDatabaseConnection() {
  if (isDbConnected()) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDatabaseConnection();
    return app(req, res);
  } catch (error) {
    console.error('Backend initialization failed:', error.message);

    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again shortly.',
    });
  }
}