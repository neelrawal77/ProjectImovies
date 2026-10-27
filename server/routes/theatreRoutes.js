import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { listTheatres, getTheatre, createTheatre, updateTheatre, deleteTheatre } from '../controllers/theatreController.js';

const router = Router();
const id = param('id').isMongoId().withMessage('Invalid theatre id');

const rules = (partial) => {
  const f = (name) => (partial ? body(name).optional() : body(name));
  return [
    f('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Theatre name is required'),
    f('location').isString().trim().isLength({ min: 1, max: 150 }).withMessage('Location is required'),
    f('theatreCode').isString().trim().toUpperCase().matches(/^[A-Z0-9-]{2,12}$/).withMessage('Identifier must be 2-12 letters, numbers or dashes'),
    f('sections').isArray({ min: 1, max: 5 }).withMessage('Add 1-5 seat sections'),
    body('sections.*.name').optional().isString().trim().isLength({ min: 1, max: 30 }).withMessage('Section name is required'),
    body('sections.*.rows').optional().isInt({ min: 1, max: 26 }).withMessage('Rows must be 1-26').toInt(),
    body('sections.*.seatsPerRow').optional().isInt({ min: 1, max: 30 }).withMessage('Seats per row must be 1-30').toInt(),
    body('sections.*.price').optional().isInt({ min: 1, max: 100000 }).withMessage('Price must be a whole number of rupees').toInt(),
    body('sections').optional().custom((sections) => {
      if (!Array.isArray(sections)) return true;
      if (sections.some((s) => !s || s.rows === undefined || s.seatsPerRow === undefined || s.price === undefined || !s.name)) {
        throw new Error('Each section needs a name, rows, seats per row and price');
      }
      if (sections.reduce((t, s) => t + Number(s.rows), 0) > 26) throw new Error('At most 26 rows in total');
      return true;
    }),
  ];
};

router.get('/', listTheatres);
router.get('/:id', id, validate, getTheatre);
router.post('/', protect, adminOnly, rules(false), validate, createTheatre);
router.put('/:id', protect, adminOnly, id, rules(true), validate, updateTheatre);
router.delete('/:id', protect, adminOnly, id, validate, deleteTheatre);

export default router;
