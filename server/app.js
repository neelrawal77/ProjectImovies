
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { config } from './config/env.js';
import { dbStatus, isDbConnected } from './config/db.js';
import requireDb from './middleware/requireDb.js';
import { notFound, errorHandler } from './middleware/error.js';

import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import theatreRoutes from './routes/theatreRoutes.js';
import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // Allow the deployed frontend and local development frontend.
  const allowedOrigins = [
    'https://i-movies-movie-ticket-booking-ten.vercel.app',
    'http://localhost:5173',
    ...(Array.isArray(config.clientUrls)
      ? config.clientUrls
      : typeof config.clientUrls === 'string'
        ? config.clientUrls.split(',').map((url) => url.trim())
        : []),
  ].filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        // Requests without an Origin header, such as health checks, are allowed.
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    })
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // Health-check endpoint
  app.get('/api/health', (req, res) => {
    const connected = isDbConnected();

    res.status(connected ? 200 : 503).json({
      success: connected,
      status: connected ? 'ok' : 'degraded',
      database: {
        status: dbStatus(),
        name: connected ? mongoose.connection.name : null,
      },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api', requireDb);
  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/theatres', theatreRoutes);
  app.use('/api/shows', showRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/favorites', favoriteRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp();
