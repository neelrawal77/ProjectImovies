import { Router } from 'express';
import { param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { stats, adminCancelBooking, listUsers } from '../controllers/adminController.js';
import { allBookings } from '../controllers/bookingController.js';

// Movies, theatres and shows are managed through their own admin-guarded CRUD routes;
// this router adds the dashboard, booking management and user listing.
const router = Router();
router.use(protect, adminOnly);

router.get('/stats', stats);
router.get('/users', listUsers);
router.get('/bookings', allBookings);
router.patch('/bookings/:id/cancel', param('id').isMongoId().withMessage('Invalid booking id'), validate, adminCancelBooking);

export default router;
