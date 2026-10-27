import Review from '../models/reviewModel.js';
import Movie from '../models/movieModel.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listForMovie = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ movie: req.params.movieId }).sort({ createdAt: -1 }).limit(100).populate('user', 'username');
  res.json({ success: true, data: reviews });
});

export const myReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('movie', 'name posterUrl');
  res.json({ success: true, data: reviews });
});

export const createReview = asyncHandler(async (req, res) => {
  const { movieId, rating, text } = req.body;
  if (!(await Movie.exists({ _id: movieId }))) throw new AppError('Movie not found', 404);
  if (await Review.exists({ user: req.user._id, movie: movieId })) {
    throw new AppError('You have already reviewed this movie. Edit your review instead.', 409);
  }
  const review = await Review.create({ user: req.user._id, movie: movieId, rating, text });
  await review.populate('user', 'username');
  res.status(201).json({ success: true, message: 'Review posted', data: review });
});

async function ownedReview(req, allowAdmin) {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  const owner = String(review.user) === String(req.user._id);
  if (!owner && !(allowAdmin && req.user.role === 'admin')) throw new AppError('You can only change your own reviews', 403);
  return review;
}

export const updateReview = asyncHandler(async (req, res) => {
  const review = await ownedReview(req, false);
  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.text !== undefined) review.text = req.body.text;
  await review.save();
  await review.populate('user', 'username');
  res.json({ success: true, message: 'Review updated', data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await ownedReview(req, true);
  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted' });
});
