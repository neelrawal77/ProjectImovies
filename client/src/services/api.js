import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true, // send the HTTP-only auth cookie
});

/** Turn any axios error into a single human-readable sentence. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err.response) return 'Cannot reach the server. Is the backend running?';
  const d = err.response.data;
  if (d?.errors?.length) return d.errors.map((e) => e.message).join('. ');
  return d?.message || fallback;
}

const unwrap = (p) => p.then((r) => r.data);

export const authApi = {
  register: (body) => unwrap(api.post('/auth/register', body)),
  login: (body) => unwrap(api.post('/auth/login', body)),
  logout: () => unwrap(api.post('/auth/logout')),
  me: () => unwrap(api.get('/auth/me')),
};
export const moviesApi = {
  list: (params) => unwrap(api.get('/movies', { params })),
  genres: () => unwrap(api.get('/movies/genres')),
  get: (id) => unwrap(api.get(`/movies/${id}`)),
  create: (body) => unwrap(api.post('/movies', body)),
  update: (id, body) => unwrap(api.put(`/movies/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/movies/${id}`)),
};
export const theatresApi = {
  list: () => unwrap(api.get('/theatres')),
  get: (id) => unwrap(api.get(`/theatres/${id}`)),
  create: (body) => unwrap(api.post('/theatres', body)),
  update: (id, body) => unwrap(api.put(`/theatres/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/theatres/${id}`)),
};
export const showsApi = {
  list: (params) => unwrap(api.get('/shows', { params })),
  get: (id) => unwrap(api.get(`/shows/${id}`)),
  forMovie: (movieId) => unwrap(api.get(`/shows/movie/${movieId}`)),
  create: (body) => unwrap(api.post('/shows', body)),
  update: (id, body) => unwrap(api.put(`/shows/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/shows/${id}`)),
};
export const bookingsApi = {
  create: (body) => unwrap(api.post('/bookings', body)),
  mine: () => unwrap(api.get('/bookings/my')),
  get: (id) => unwrap(api.get(`/bookings/${id}`)),
  cancel: (id) => unwrap(api.patch(`/bookings/${id}/cancel`)),
  adminAll: (params) => unwrap(api.get('/bookings/admin/all', { params })),
};
export const favoritesApi = {
  list: () => unwrap(api.get('/favorites')),
  ids: () => unwrap(api.get('/favorites/ids')),
  add: (movieId) => unwrap(api.post('/favorites', { movieId })),
  remove: (movieId) => unwrap(api.delete(`/favorites/${movieId}`)),
};
export const reviewsApi = {
  forMovie: (movieId) => unwrap(api.get(`/reviews/movie/${movieId}`)),
  create: (body) => unwrap(api.post('/reviews', body)),
  update: (id, body) => unwrap(api.put(`/reviews/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/reviews/${id}`)),
};
export const adminApi = {
  stats: () => unwrap(api.get('/admin/stats')),
  cancelBooking: (id) => unwrap(api.patch(`/admin/bookings/${id}/cancel`)),
};

export default api;
