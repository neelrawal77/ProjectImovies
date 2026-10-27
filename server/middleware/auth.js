import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { config } from '../config/env.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;
  const header = req.headers.authorization;
  if (!token && header?.startsWith('Bearer ')) token = header.slice(7);
  if (!token) throw new AppError('Please log in to continue', 401);

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    throw new AppError('Your session is invalid or has expired. Please log in again', 401);
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('This account no longer exists', 401);
  req.user = user;
  next();
});

export const adminOnly = (req, res, next) =>
  req.user?.role === 'admin' ? next() : next(new AppError('Admin access required', 403));
