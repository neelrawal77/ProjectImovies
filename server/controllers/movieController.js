import Movie from '../models/movieModel.js';
import Show from '../models/showModel.js';
import Review from '../models/reviewModel.js';
import Favorite from '../models/favoriteModel.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex, pagination } from '../utils/misc.js';

const FIELDS = ['name', 'description', 'genres', 'releaseDate', 'duration', 'language', 'certificate', 'posterUrl', 'trailerUrl'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// Ratings are averaged in JS from a slim query: portable across MongoDB-compatible servers
// and plenty fast at catalogue scale (one page of movies per request).
async function withRatings(movies) {
  const ids = movies.map((m) => m._id);
  const reviews = await Review.find({ movie: { $in: ids } }).select('movie rating').lean();
  const stats = new Map();
  for (const r of reviews) {
    const key = String(r.movie);
    const cur = stats.get(key) || { total: 0, count: 0 };
    cur.total += r.rating;
    cur.count += 1;
    stats.set(key, cur);
  }
  return movies.map((m) => {
    const a = stats.get(String(m._id));
    return { ...m, rating: a ? Math.round((a.total / a.count) * 10) / 10 : null, reviewCount: a ? a.count : 0 };
  });
}

export const listMovies = asyncHandler(async (req, res) => {
  const { search, genre, language, sort } = req.query;
  const filter = {};
  if (search) filter.name = new RegExp(escapeRegex(search), 'i');
  if (genre) filter.genres = new RegExp(`^${escapeRegex(genre)}$`, 'i');
  if (language) filter.language = new RegExp(`^${escapeRegex(language)}$`, 'i');
  const { page, limit, skip } = pagination(req.query);
  const order = sort === 'name' ? { name: 1 } : { releaseDate: -1, name: 1 };

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort(order).skip(skip).limit(limit).lean(),
    Movie.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: await withRatings(movies),
    pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
  });
});

export const listGenres = asyncHandler(async (req, res) => {
  const genres = await Movie.distinct('genres');
  res.json({ success: true, data: genres.sort() });
});

export const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id).lean();
  if (!movie) throw new AppError('Movie not found', 404);
  const [withRating] = await withRatings([movie]);
  res.json({ success: true, data: withRating });
});

export const createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(pick(req.body));
  res.status(201).json({ success: true, message: 'Movie added', data: movie });
});

export const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new AppError('Movie not found', 404);
  movie.set(pick(req.body));
  await movie.save();
  res.json({ success: true, message: 'Movie updated', data: movie });
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new AppError('Movie not found', 404);
  if (await Show.exists({ movie: movie._id })) {
    throw new AppError('This movie still has shows. Delete its shows first.', 409);
  }
  await Promise.all([movie.deleteOne(), Favorite.deleteMany({ movie: movie._id }), Review.deleteMany({ movie: movie._id })]);
  res.json({ success: true, message: 'Movie deleted' });
});
