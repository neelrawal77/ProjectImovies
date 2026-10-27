import { Router } from 'express';
import { body, param, query } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { listShows, listShowsForMovie, getShow, createShow, updateShow, deleteShow } from '../controllers/showController.js';

const router = Router();
const id = param('id').isMongoId().withMessage('Invalid show id');
const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00`).getTime());

const rules = (partial) => {
  const f = (name) => (partial ? body(name).optional() : body(name));
  return [
    f('movie').isMongoId().withMessage('Pick a movie'),
    f('theatre').isMongoId().withMessage('Pick a theatre'),
    f('date').isString().custom(validDate).withMessage('Date must be YYYY-MM-DD'),
    f('time').isString().matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be HH:mm (24-hour)'),
  ];
};

router.get(
  '/',
  query('movie').optional().isMongoId(),
  query('theatre').optional().isMongoId(),
  query('date').optional().custom(validDate),
  query('upcoming').optional().isIn(['true', 'false']),
  validate,
  listShows
);
router.get('/movie/:movieId', param('movieId').isMongoId().withMessage('Invalid movie id'), validate, listShowsForMovie);
router.get('/:id', id, validate, getShow);
router.post('/', protect, adminOnly, rules(false), validate, createShow);
router.put('/:id', protect, adminOnly, id, rules(true), validate, updateShow);
router.delete('/:id', protect, adminOnly, id, validate, deleteShow);

export default router;
