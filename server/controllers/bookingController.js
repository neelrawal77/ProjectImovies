import Booking from '../models/bookingModel.js';
import Show from '../models/showModel.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { priceSeats } from '../utils/seatLayout.js';
import { reserveSeats, releaseSeats, cancelBooking } from '../services/bookingService.js';
import { pagination } from '../utils/misc.js';

export const BOOKING_POPULATE = [
  { path: 'show', populate: [{ path: 'movie', select: 'name posterUrl' }, { path: 'theatre', select: 'name location' }] },
  { path: 'user', select: 'username email' },
];

/**
 * Seat reservation is delegated to reserveSeats(): a unique (show, seatId) index guarantees that
 * two users can never hold the same seat, even when requests race. If anything fails after the
 * reservation, the seats are released again.
 */
export const createBooking = asyncHandler(async (req, res) => {
  const { showId, demoPaymentOutcome = 'success' } = req.body;
  const seatIds = [...new Set(req.body.seats)];

  const show = await Show.findById(showId);
  if (!show) throw new AppError('Show not found', 404);
  if (show.startsAt <= new Date()) throw new AppError('This show has already started', 400);

  const { seats, total, invalid } = priceSeats(show.sections, seatIds);
  if (invalid.length) throw new AppError(`Unknown seat(s): ${invalid.join(', ')}`, 400);

  const alreadyTaken = seatIds.filter((id) => show.bookedSeats.includes(id));
  if (alreadyTaken.length) {
    throw new AppError('One or more of those seats are already booked. Please pick different seats.', 409);
  }
  const token = await reserveSeats(show._id, seatIds); // throws 409 if another user won the race

  let booking;
  try {
    booking = await Booking.create({
      user: req.user._id,
      show: show._id,
      seats,
      totalAmount: total, // never taken from the client
      status: 'pending',
      paymentStatus: 'pending',
    });

    // ---- Demo payment: simulated, no card data, no money moves ----
    if (demoPaymentOutcome === 'failure') {
      booking.status = 'payment_failed';
      booking.paymentStatus = 'failed';
      await booking.save();
      await releaseSeats(show._id, seatIds, token);
      await booking.populate(BOOKING_POPULATE);
      return res.status(402).json({
        success: false,
        message: 'Demo payment failed (simulated). Your seats were released and you were not charged.',
        data: booking,
      });
    }
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    await booking.save();
  } catch (err) {
    await releaseSeats(show._id, seatIds, token).catch(() => {});
    if (booking && booking.status === 'pending') await booking.deleteOne().catch(() => {});
    throw err;
  }

  await booking.populate(BOOKING_POPULATE);
  return res.status(201).json({ success: true, message: 'Booking confirmed (demo payment)', data: booking });
});

export const myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 }).populate(BOOKING_POPULATE);
  res.json({ success: true, data: bookings });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(BOOKING_POPULATE);
  const isOwner = booking && String(booking.user._id) === String(req.user._id);
  if (!booking || (!isOwner && req.user.role !== 'admin')) throw new AppError('Booking not found', 404);
  res.json({ success: true, data: booking });
});

export const cancelMyBooking = asyncHandler(async (req, res) => {
  const updated = await cancelBooking(req.params.id, { user: req.user, asAdmin: false });
  await updated.populate(BOOKING_POPULATE);
  res.json({ success: true, message: 'Booking cancelled. Your demo payment was marked as refunded.', data: updated });
});

export const allBookings = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = pagination(req.query, 20, 100);
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.bookingId = search.toUpperCase().trim();
  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(BOOKING_POPULATE),
    Booking.countDocuments(filter),
  ]);
  res.json({ success: true, data: bookings, pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) } });
});
