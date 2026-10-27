import crypto from 'crypto';
import Booking from '../models/bookingModel.js';
import Show from '../models/showModel.js';
import SeatLock from '../models/seatLockModel.js';
import AppError from '../utils/AppError.js';
import { config } from '../config/env.js';

const TAKEN = 'One or more of those seats were just booked by someone else. Please pick different seats.';

/**
 * Atomically reserve seats.
 *  1. Insert one SeatLock per seat. The unique (show, seatId) index makes this all-or-nothing in
 *     effect: if any seat is already locked the insert fails with a duplicate-key error and we
 *     remove whatever this attempt managed to insert.
 *  2. Mirror the seats into show.bookedSeats so the seat map can be read from one document.
 * Works on a standalone MongoDB — no transactions or replica set required.
 * Returns a token identifying this reservation (used for rollback).
 */
export async function reserveSeats(showId, seatIds) {
  const token = crypto.randomBytes(8).toString('hex');
  try {
    await SeatLock.insertMany(seatIds.map((seatId) => ({ show: showId, seatId, holder: token })), { ordered: true });
  } catch (err) {
    await SeatLock.deleteMany({ show: showId, holder: token }).catch(() => {});
    if (err.code === 11000 || err.writeErrors?.some((w) => w.code === 11000) || /E11000|duplicate key/i.test(err.message)) {
      throw new AppError(TAKEN, 409);
    }
    throw err;
  }
  await Show.updateOne({ _id: showId }, { $addToSet: { bookedSeats: { $each: seatIds } } });
  return token;
}

/** Free seats again (idempotent). */
export async function releaseSeats(showId, seatIds, token) {
  await SeatLock.deleteMany({ show: showId, seatId: { $in: seatIds }, ...(token ? { holder: token } : {}) });
  await Show.updateOne({ _id: showId }, { $pullAll: { bookedSeats: seatIds } });
}

/**
 * Cancel a confirmed booking and release its seats.
 * Policy: users may cancel until `cancelCutoffHours` before the show; admins may always cancel.
 * Demo refund: paymentStatus becomes "refunded" (no money moves).
 */
export async function cancelBooking(bookingId, { user, asAdmin = false }) {
  const booking = await Booking.findById(bookingId).populate('show');
  if (!booking || (!asAdmin && String(booking.user) !== String(user._id))) {
    throw new AppError('Booking not found', 404);
  }
  if (booking.status !== 'confirmed') throw new AppError('Only confirmed bookings can be cancelled', 400);

  if (!asAdmin && booking.show) {
    const cutoff = booking.show.startsAt.getTime() - config.cancelCutoffHours * 3600 * 1000;
    if (Date.now() > cutoff) {
      throw new AppError(
        `Bookings can only be cancelled up to ${config.cancelCutoffHours} hours before the show starts`,
        400
      );
    }
  }

  // Conditional update: only one concurrent cancel can win, so seats are released exactly once.
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'confirmed' },
    { status: 'cancelled', paymentStatus: 'refunded', cancelledAt: new Date() },
    { new: true }
  );
  if (!updated) throw new AppError('This booking was already cancelled', 409);

  await releaseSeats(booking.show?._id || booking.show, booking.seats.map((s) => s.seatId));
  return updated;
}
