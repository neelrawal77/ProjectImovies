import User from '../models/userModel.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';

// Registration never reads a "role" from the request: new accounts are always plain users.
export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (await User.exists({ email })) throw new AppError('An account with this email already exists', 409);
  const user = await User.create({ username, email, password });
  setAuthCookie(res, signToken(user));
  res.status(201).json({ success: true, message: 'Account created', data: { user } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Incorrect email or password', 401);
  setAuthCookie(res, signToken(user));
  res.json({ success: true, message: 'Logged in', data: { user } });
});

export const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
};

export const me = (req, res) => res.json({ success: true, data: { user: req.user } });
