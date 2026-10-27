import mongoose from 'mongoose';

export const CERTIFICATES = ['U', 'U/A', 'A', 'S'];

const movieSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Movie name is required'], trim: true, maxlength: 150 },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 2000 },
    genres: {
      type: [{ type: String, trim: true }],
      validate: [(v) => v.length > 0, 'Pick at least one genre'],
    },
    releaseDate: { type: Date, required: [true, 'Release date is required'] },
    duration: { type: Number, required: [true, 'Duration is required'], min: 1, max: 600 }, // minutes
    language: { type: String, required: [true, 'Language is required'], trim: true },
    certificate: { type: String, enum: CERTIFICATES, default: 'U/A' },
    posterUrl: { type: String, trim: true, default: '' },
    trailerUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

movieSchema.index({ name: 1 });
movieSchema.index({ genres: 1 });
movieSchema.index({ releaseDate: -1 });

export default mongoose.model('Movie', movieSchema);
