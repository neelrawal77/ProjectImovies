import Theatre from '../models/theatreModel.js';
import Show from '../models/showModel.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const FIELDS = ['name', 'location', 'theatreCode', 'sections'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
const dupMessage = (err) => {
  if (err.code === 11000) {
    err.expose = true;
    err.message = 'A theatre with this identifier already exists';
  }
  return err;
};

export const listTheatres = asyncHandler(async (req, res) => {
  const theatres = await Theatre.find().sort({ name: 1 });
  res.json({ success: true, data: theatres });
});

export const getTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) throw new AppError('Theatre not found', 404);
  res.json({ success: true, data: theatre });
});

export const createTheatre = asyncHandler(async (req, res) => {
  try {
    const theatre = await Theatre.create(pick(req.body));
    res.status(201).json({ success: true, message: 'Theatre added', data: theatre });
  } catch (err) {
    throw dupMessage(err);
  }
});

export const updateTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) throw new AppError('Theatre not found', 404);
  try {
    theatre.set(pick(req.body));
    await theatre.save(); // existing shows keep their own snapshot of the layout and prices
  } catch (err) {
    throw dupMessage(err);
  }
  res.json({ success: true, message: 'Theatre updated', data: theatre });
});

export const deleteTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) throw new AppError('Theatre not found', 404);
  if (await Show.exists({ theatre: theatre._id })) {
    throw new AppError('This theatre still has shows. Delete its shows first.', 409);
  }
  await theatre.deleteOne();
  res.json({ success: true, message: 'Theatre deleted' });
});
