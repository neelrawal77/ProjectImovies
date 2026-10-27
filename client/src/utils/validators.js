// Client-side validation mirrors the server rules (the server remains the authority).
const EMAIL = /^\S+@\S+\.\S+$/;

export function validateLogin({ email, password }) {
  const e = {};
  if (!EMAIL.test(email || '')) e.email = 'Enter a valid email address';
  if (!password) e.password = 'Password is required';
  return e;
}

export function validateRegister({ username, email, password, confirmPassword }) {
  const e = {};
  if (!username || username.trim().length < 3 || username.trim().length > 30) e.username = 'Username must be 3-30 characters';
  if (!EMAIL.test(email || '')) e.email = 'Enter a valid email address';
  if (!password || password.length < 8) e.password = 'Password must be at least 8 characters';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) e.password = 'Password needs at least one letter and one number';
  if (confirmPassword !== password) e.confirmPassword = 'Passwords do not match';
  return e;
}

const isUrlOrPath = (v) => !v || /^https?:\/\/\S+$/i.test(v) || /^\/[\w./-]+$/.test(v);

export function validateMovie(f) {
  const e = {};
  if (!f.name?.trim()) e.name = 'Movie name is required';
  if (!f.description || f.description.trim().length < 10) e.description = 'Description must be at least 10 characters';
  if (!f.genres?.length) e.genres = 'Pick at least one genre';
  if (!f.releaseDate) e.releaseDate = 'Release date is required';
  const d = Number(f.duration);
  if (!Number.isInteger(d) || d < 1 || d > 600) e.duration = 'Duration must be 1-600 minutes';
  if (!f.language?.trim()) e.language = 'Language is required';
  if (!isUrlOrPath(f.posterUrl?.trim())) e.posterUrl = 'Use an http(s) URL or a /path';
  if (f.trailerUrl?.trim() && !/^https?:\/\/\S+$/i.test(f.trailerUrl.trim())) e.trailerUrl = 'Use an http(s) URL';
  return e;
}

export function validateTheatre(f) {
  const e = {};
  if (!f.name?.trim()) e.name = 'Theatre name is required';
  if (!f.location?.trim()) e.location = 'Location is required';
  if (!/^[A-Za-z0-9-]{2,12}$/.test(f.theatreCode || '')) e.theatreCode = 'Identifier: 2-12 letters, numbers or dashes';
  if (!f.sections?.length) e.sections = 'Add at least one seat section';
  else {
    const bad = f.sections.some((s) => !s.name?.trim() || !(s.rows >= 1 && s.rows <= 26) || !(s.seatsPerRow >= 1 && s.seatsPerRow <= 30) || !(s.price >= 1));
    if (bad) e.sections = 'Each section needs a name, 1-26 rows, 1-30 seats per row and a price';
    else if (f.sections.reduce((t, s) => t + Number(s.rows), 0) > 26) e.sections = 'At most 26 rows in total';
  }
  return e;
}

export function validateShow(f, { editing = false } = {}) {
  const e = {};
  if (!f.movie) e.movie = 'Pick a movie';
  if (!f.theatre) e.theatre = 'Pick a theatre';
  if (!f.date) e.date = 'Pick a date';
  if (!f.time) e.time = 'Pick a time';
  if (!editing && f.date && f.time && new Date(`${f.date}T${f.time}:00`) <= new Date()) e.time = 'Show time must be in the future';
  return e;
}
