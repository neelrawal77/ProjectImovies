import Show from '../models/showModel.js';
import Movie from '../models/movieModel.js';
import Theatre from '../models/theatreModel.js';
import Booking from '../models/bookingModel.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildSeats } from '../utils/seatLayout.js';

const POPULATE = [
  { path: 'movie', select: 'name posterUrl duration language certificate genres' },
  { path: 'theatre', select: 'name location theatreCode' },
];

const clashError = (err) => {
  if (err.code === 11000) {
    err.expose = true;
    err.message = 'That theatre already has a show at this date and time';
  }
  return err;
};

export const listShows = asyncHandler(async (req, res) => {
  const { movie, theatre, date, upcoming } = req.query;
  const filter = {};
  if (movie) filter.movie = movie;
  if (theatre) filter.theatre = theatre;
  if (date) filter.date = date;
  if (upcoming === 'true') filter.startsAt = { $gt: new Date() };
  const shows = await Show.find(filter).sort({ startsAt: 1 }).limit(500).populate(POPULATE);
  res.json({ success: true, data: shows });
});

export const listShowsForMovie = asyncHandler(async (req, res) => {
  const shows = await Show.find({ movie: req.params.movieId, startsAt: { $gt: new Date() } })
    .sort({ startsAt: 1 })
    .populate(POPULATE);
  res.json({ success: true, data: shows });
});

/** A show plus its full seat map (each seat flagged booked or free). */
export const getShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id).populate(POPULATE);
  if (!show) throw new AppError('Show not found', 404);
  const taken = new Set(show.bookedSeats);
  const seats = buildSeats(show.sections).map((s) => ({ ...s, booked: taken.has(s.id) }));
  res.json({ success: true, data: { ...show.toJSON(), seats } });
});

export const createShow = asyncHandler(async (req, res) => {
  const { movie, theatre, date, time } = req.body;
  const [movieDoc, theatreDoc] = await Promise.all([Movie.findById(movie), Theatre.findById(theatre)]);
  if (!movieDoc) throw new AppError('Movie not found', 404);
  if (!theatreDoc) throw new AppError('Theatre not found', 404);

  const show = new Show({ movie, theatre, date, time, sections: theatreDoc.sections.map((s) => s.toObject()) });
  try {
    await show.validate();
    if (show.startsAt <= new Date()) throw new AppError('Show time must be in the future', 400);
    await show.save();
  } catch (err) {
    throw clashError(err);
  }
  await show.populate(POPULATE);
  res.status(201).json({ success: true, message: 'Show added', data: show });
});

export const updateShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) throw new AppError('Show not found', 404);
  const { movie, theatre, date, time } = req.body;

  if (movie && String(movie) !== String(show.movie)) {
    if (!(await Movie.exists({ _id: movie }))) throw new AppError('Movie not found', 404);
    show.movie = movie;
  }
  if (theatre && String(theatre) !== String(show.theatre)) {
    if (show.bookedSeats.length) throw new AppError('Seats are already booked, so the theatre cannot be changed', 409);
    const theatreDoc = await Theatre.findById(theatre);
    if (!theatreDoc) throw new AppError('Theatre not found', 404);
    show.theatre = theatre;
    show.sections = theatreDoc.sections.map((s) => s.toObject());
  }
  if (date) show.date = date;
  if (time) show.time = time;

  try {
    await show.save();
  } catch (err) {
    throw clashError(err);
  }
  await show.populate(POPULATE);
  res.json({ success: true, message: 'Show updated', data: show });
});

export const deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) throw new AppError('Show not found', 404);
  if (await Booking.exists({ show: show._id, status: 'confirmed' })) {
    throw new AppError('This show has confirmed bookings. Cancel them before deleting the show.', 409);
  }
  await Booking.deleteMany({ show: show._id }); // only cancelled / failed records remain at this point
  await show.deleteOne();
  res.json({ success: true, message: 'Show deleted' });
});
