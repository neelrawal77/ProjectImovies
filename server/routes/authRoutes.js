import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { register, login, logout, me } from '../controllers/authController.js';

const router = Router();

const email = body('email').isString().trim().isEmail().withMessage('Enter a valid email').normalizeEmail();

router.post(
  '/register',
  authLimiter,
  body('username').isString().trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  email,
  body('password')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8-72 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password needs a letter')
    .matches(/\d/)
    .withMessage('Password needs a number'),
  validate,
  register
);
router.post('/login', authLimiter, email, body('password').isString().notEmpty().withMessage('Password is required'), validate, login);
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;
