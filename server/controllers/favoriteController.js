import Favorite from '../models/favoriteModel.js';
import Movie from '../models/movieModel.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listFavorites = asyncHandler(async (req, res) => {
  const favs = await Favorite.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('movie');
  res.json({ success: true, data: favs.filter((f) => f.movie) });
});

export const favoriteIds = asyncHandler(async (req, res) => {
  const ids = await Favorite.distinct('movie', { user: req.user._id });
  res.json({ success: true, data: ids });
});

export const addFavorite = asyncHandler(async (req, res) => {
  const { movieId } = req.body;
  if (!(await Movie.exists({ _id: movieId }))) throw new AppError('Movie not found', 404);
  // Upsert keeps this idempotent; the unique index also blocks duplicates under concurrency.
  const fav = await Favorite.findOneAndUpdate(
    { user: req.user._id, movie: movieId },
    { $setOnInsert: { user: req.user._id, movie: movieId } },
    { upsert: true, new: true }
  );
  res.status(201).json({ success: true, message: 'Added to favorites', data: fav });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await Favorite.deleteOne({ user: req.user._id, movie: req.params.movieId });
  res.json({ success: true, message: 'Removed from favorites' });
});
