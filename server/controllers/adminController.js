import User from '../models/userModel.js';
import Movie from '../models/movieModel.js';
import Theatre from '../models/theatreModel.js';
import Show from '../models/showModel.js';
import Booking from '../models/bookingModel.js';
import asyncHandler from '../utils/asyncHandler.js';
import { cancelBooking } from '../services/bookingService.js';
import { BOOKING_POPULATE } from './bookingController.js';

const STATUSES = ['pending', 'confirmed', 'cancelled', 'payment_failed'];

export const stats = asyncHandler(async (req, res) => {
  const [users, movies, theatres, shows, upcomingShows, bookings, byStatus, revenueAgg, recent] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Movie.countDocuments(),
    Theatre.countDocuments(),
    Show.countDocuments(),
    Show.countDocuments({ startsAt: { $gt: new Date() } }),
    Booking.countDocuments(),
    Promise.all(STATUSES.map((st) => Booking.countDocuments({ status: st }))),
    Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, seats: { $sum: '$seatCount' } } },
    ]),
    Booking.find().sort({ createdAt: -1 }).limit(5).populate(BOOKING_POPULATE),
  ]);
  res.json({
    success: true,
    data: {
      users, movies, theatres, shows, upcomingShows, bookings,
      bookingsByStatus: Object.fromEntries(STATUSES.map((st, i) => [st, byStatus[i]])),
      demoRevenue: revenueAgg[0]?.revenue || 0, // simulated amounts from demo payments
      seatsSold: revenueAgg[0]?.seats || 0,
      recentBookings: recent,
    },
  });
});

export const adminCancelBooking = asyncHandler(async (req, res) => {
  const updated = await cancelBooking(req.params.id, { user: req.user, asAdmin: true });
  await updated.populate(BOOKING_POPULATE);
  res.json({ success: true, message: 'Booking cancelled by admin', data: updated });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: users });
});
