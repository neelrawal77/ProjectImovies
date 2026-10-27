import { isDbConnected } from '../config/db.js';

/** Refuse database-dependent requests while MongoDB is unavailable. */
export default function requireDb(req, res, next) {
  if (isDbConnected()) return next();
  return res.status(503).json({
    success: false,
    message: 'The database is currently unavailable. Please try again shortly.',
  });
}
