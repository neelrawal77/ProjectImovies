import { Router } from 'express';
import { body, param, query } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { CERTIFICATES } from '../models/movieModel.js';
import { listMovies, listGenres, getMovie, createMovie, updateMovie, deleteMovie } from '../controllers/movieController.js';

const router = Router();
const id = param('id').isMongoId().withMessage('Invalid movie id');
const urlOrPath = (v) => v === '' || /^https?:\/\/\S+$/i.test(v) || /^\/[\w./-]+$/.test(v);

const rules = (partial) => {
  const f = (name) => (partial ? body(name).optional() : body(name));
  return [
    f('name').isString().trim().isLength({ min: 1, max: 150 }).withMessage('Name is required (max 150 characters)'),
    f('description').isString().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    f('genres').isArray({ min: 1, max: 6 }).withMessage('Pick 1-6 genres'),
    body('genres.*').optional().isString().trim().isLength({ min: 1, max: 30 }),
    f('releaseDate').isISO8601().withMessage('Release date must be a valid date'),
    f('duration').isInt({ min: 1, max: 600 }).withMessage('Duration must be 1-600 minutes').toInt(),
    f('language').isString().trim().isLength({ min: 1, max: 40 }).withMessage('Language is required'),
    body('certificate').optional().isIn(CERTIFICATES).withMessage(`Certificate must be one of ${CERTIFICATES.join(', ')}`),
    body('posterUrl').optional().isString().trim().custom(urlOrPath).withMessage('Poster must be an http(s) URL or a /path'),
    body('trailerUrl').optional().isString().trim().custom((v) => v === '' || /^https?:\/\/\S+$/i.test(v)).withMessage('Trailer must be an http(s) URL'),
  ];
};

router.get(
  '/',
  query('search').optional().isString().isLength({ max: 100 }),
  query('genre').optional().isString().isLength({ max: 40 }),
  query('language').optional().isString().isLength({ max: 40 }),
  query('sort').optional().isIn(['name', 'newest']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  listMovies
);
router.get('/genres', listGenres);
router.get('/:id', id, validate, getMovie);
router.post('/', protect, adminOnly, rules(false), validate, createMovie);
router.put('/:id', protect, adminOnly, id, rules(true), validate, updateMovie);
router.delete('/:id', protect, adminOnly, id, validate, deleteMovie);

export default router;
