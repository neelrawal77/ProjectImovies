import mongoose from 'mongoose';

export const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 30 },
    rows: { type: Number, required: true, min: 1, max: 26, validate: Number.isInteger },
    seatsPerRow: { type: Number, required: true, min: 1, max: 30, validate: Number.isInteger },
    price: { type: Number, required: true, min: 1, max: 100000, validate: Number.isInteger }, // INR
  },
  { _id: false }
);

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Theatre name is required'], trim: true, maxlength: 100 },
    location: { type: String, required: [true, 'Location is required'], trim: true, maxlength: 150 },
    theatreCode: { type: String, required: true, unique: true, uppercase: true, trim: true, match: /^[A-Z0-9-]{2,12}$/ },
    sections: {
      type: [sectionSchema],
      validate: [
        {
          validator: (v) => v.length >= 1 && v.length <= 5,
          message: 'A theatre needs between 1 and 5 seat sections',
        },
        {
          validator: (v) => v.reduce((t, s) => t + s.rows, 0) <= 26,
          message: 'A theatre can have at most 26 rows in total',
        },
      ],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

theatreSchema.virtual('totalSeats').get(function totalSeats() {
  return (this.sections || []).reduce((t, s) => t + s.rows * s.seatsPerRow, 0);
});

export default mongoose.model('Theatre', theatreSchema);
