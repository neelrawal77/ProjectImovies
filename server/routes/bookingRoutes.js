import { Router } from 'express';
import { body, param, query } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { config } from '../config/env.js';
import { createBooking, myBookings, getBooking, cancelMyBooking, allBookings } from '../controllers/bookingController.js';

const router = Router();
router.use(protect);
const id = param('id').isMongoId().withMessage('Invalid booking id');

router.post(
  '/',
  body('showId').isMongoId().withMessage('Invalid show'),
  body('seats').isArray({ min: 1, max: config.maxSeatsPerBooking }).withMessage(`Select 1-${config.maxSeatsPerBooking} seats`),
  body('seats.*').isString().matches(/^[A-Z]\d{1,2}$/).withMessage('Invalid seat id'),
  body('demoPaymentOutcome').optional().isIn(['success', 'failure']),
  validate,
  createBooking
);
router.get('/my', myBookings);
router.get(
  '/admin/all',
  adminOnly,
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'payment_failed']),
  query('search').optional().isString().isLength({ max: 40 }),
  query('page').optional().isInt({ min: 1 }),
  validate,
  allBookings
);
router.get('/:id', id, validate, getBooking);
router.patch('/:id/cancel', id, validate, cancelMyBooking);

export default router;
