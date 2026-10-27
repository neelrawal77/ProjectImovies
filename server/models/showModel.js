import mongoose from 'mongoose';
import { sectionSchema } from './theatreModel.js';
import { countSeats } from '../utils/seatLayout.js';

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD
    time: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, // HH:mm
    startsAt: { type: Date, required: true },
    // Copy of the theatre layout/prices at creation time, so later theatre edits never change sold shows.
    sections: { type: [sectionSchema], required: true },
    totalSeats: { type: Number, required: true },
    // Seat inventory: ids of seats that are taken. Reserved atomically (see bookingController).
    bookedSeats: { type: [String], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

showSchema.virtual('availableSeats').get(function available() {
  return this.totalSeats - (this.bookedSeats || []).length;
});

showSchema.pre('validate', function compute(next) {
  if (this.date && this.time) {
    const d = new Date(`${this.date}T${this.time}:00`); // interpreted in the server's timezone
    if (Number.isNaN(d.getTime())) this.invalidate('date', 'Invalid date or time');
    else this.startsAt = d;
  }
  if (this.sections?.length) this.totalSeats = countSeats(this.sections);
  next();
});

showSchema.index({ theatre: 1, startsAt: 1 }, { unique: true });
showSchema.index({ movie: 1, startsAt: 1 });

export default mongoose.model('Show', showSchema);
