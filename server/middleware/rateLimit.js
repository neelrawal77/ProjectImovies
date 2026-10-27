import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  message: { success: false, message: 'Too many attempts. Please wait a few minutes and try again.' },
});
