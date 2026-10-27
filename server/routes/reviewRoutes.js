import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { listForMovie, myReviews, createReview, updateReview, deleteReview } from '../controllers/reviewController.js';

const router = Router();
const rating = (partial) => (partial ? body('rating').optional() : body('rating')).isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5').toInt();
const text = body('text').optional().isString().trim().isLength({ max: 1000 }).withMessage('Review is limited to 1000 characters');

router.get('/movie/:movieId', param('movieId').isMongoId().withMessage('Invalid movie id'), validate, listForMovie);
router.get('/my', protect, myReviews);
router.post('/', protect, body('movieId').isMongoId().withMessage('Invalid movie id'), rating(false), text, validate, createReview);
router.put('/:id', protect, param('id').isMongoId(), rating(true), text, validate, updateReview);
router.delete('/:id', protect, param('id').isMongoId(), validate, deleteReview);

export default router;
