import mongoose from 'mongoose';

/**
 * One document per taken seat. The unique index on (show, seatId) is the authority that
 * prevents double booking: MongoDB enforces unique indexes atomically on every deployment
 * (standalone, replica set, Atlas), so two concurrent bookings can never both insert the same seat.
 */
const seatLockSchema = new mongoose.Schema(
  {
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    seatId: { type: String, required: true },
    holder: { type: String, required: true }, // reservation token, used to roll back a failed attempt
  },
  { timestamps: true }
);

seatLockSchema.index({ show: 1, seatId: 1 }, { unique: true });

export default mongoose.model('SeatLock', seatLockSchema);
