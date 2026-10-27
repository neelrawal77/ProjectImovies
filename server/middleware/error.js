import { config } from '../config/env.js';

export const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl.split('?')[0]}` });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || err.statusCode || 500;
  let message = err.expose ? err.message : null;
  let errors = err.errors;

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier or value';
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    status = 409;
    message = err.expose ? err.message : 'A record with that value already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (/MongoServerSelectionError|MongoNetworkError|MongooseServerSelectionError/.test(err.name || '')) {
    status = 503;
    message = 'The database is currently unavailable. Please try again shortly.';
  }

  if (status >= 500) {
    if (!config.isTest) console.error(err);
    message = message || 'Something went wrong on our side. Please try again.';
  }
  return res.status(status).json({ success: false, message: message || 'Request failed', ...(errors ? { errors } : {}) });
};
