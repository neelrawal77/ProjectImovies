import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { listFavorites, favoriteIds, addFavorite, removeFavorite } from '../controllers/favoriteController.js';

const router = Router();
router.use(protect);

router.get('/', listFavorites);
router.get('/ids', favoriteIds);
router.post('/', body('movieId').isMongoId().withMessage('Invalid movie id'), validate, addFavorite);
router.delete('/:movieId', param('movieId').isMongoId().withMessage('Invalid movie id'), validate, removeFavorite);

export default router;
