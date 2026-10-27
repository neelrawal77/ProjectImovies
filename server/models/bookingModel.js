import mongoose from 'mongoose';
import crypto from 'crypto';

export const newBookingId = () =>
  `IM-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true, default: newBookingId },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
    seats: {
      type: [{ _id: false, seatId: String, section: String, price: Number }],
      validate: [(v) => v.length > 0, 'Select at least one seat'],
    },
    seatCount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 }, // always computed on the server
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'payment_failed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['demo'], default: 'demo' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    cancelledAt: Date,
  },
  { timestamps: true }
);

bookingSchema.pre('validate', function count(next) {
  this.seatCount = this.seats ? this.seats.length : 0;
  next();
});

export default mongoose.model('Booking', bookingSchema);
