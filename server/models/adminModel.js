import mongoose from 'mongoose';

/**
 * Admin profile. Authentication stays in the single User collection (one login flow,
 * one password hash); a User with role "admin" has exactly one Admin profile that
 * records permissions and who created it.
 */
const adminSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName: { type: String, trim: true, maxlength: 60 },
    permissions: {
      type: [String],
      enum: ['manage_movies', 'manage_theatres', 'manage_shows', 'manage_bookings'],
      default: ['manage_movies', 'manage_theatres', 'manage_shows', 'manage_bookings'],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Admin', adminSchema);
