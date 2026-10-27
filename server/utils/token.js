import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, config.jwtSecret, { algorithm: 'HS256', expiresIn: '7d' });

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax',
  path: '/',
});

export const setAuthCookie = (res, token) => res.cookie('token', token, { ...cookieOptions(), maxAge: SEVEN_DAYS_MS });
export const clearAuthCookie = (res) => res.clearCookie('token', cookieOptions());
