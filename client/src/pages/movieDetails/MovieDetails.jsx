import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Button, Badge, Form } from 'react-bootstrap';
import { FiStar, FiHeart, FiPlay, FiTrash2 } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import PosterImage from '../../components/PosterImage.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { EmptyState, ErrorState } from '../../components/StateViews.jsx';
import useFetch from '../../hooks/useFetch.js';
import { moviesApi, showsApi, reviewsApi, getErrorMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { formatDate, formatDuration, formatTime, formatINR } from '../../utils/format.js';

function Reviews({ movieId, onChanged }) {
  const { user, isAdmin } = useAuth();
  const { data, loading, error, reload } = useFetch(() => reviewsApi.forMovie(movieId), [movieId]);
  const reviews = data?.data || [];
  const mine = user ? reviews.find((r) => r.user?._id === user._id) : null;
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const startEdit = () => { setRating(mine.rating); setText(mine.text); setEditing(true); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) await reviewsApi.update(mine._id, { rating: Number(rating), text });
      else await reviewsApi.create({ movieId, rating: Number(rating), text });
      toast.success(editing ? 'Review updated' : 'Review posted');
      setEditing(false); setText(''); setRating(5);
      reload(); onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    try { await reviewsApi.remove(id); toast.success('Review deleted'); reload(); onChanged(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <section className="mt-5" aria-labelledby="reviews-h">
      <h2 id="reviews-h" className="h4">Reviews</h2>
      {user && !isAdmin && (!mine || editing) && (
        <Form onSubmit={submit} className="im-panel mb-4">
          <Row className="g-3">
            <Col sm={3}>
              <Form.Label htmlFor="rv-rating">Rating</Form.Label>
              <Form.Select id="rv-rating" value={rating} onChange={(e) => setRating(e.target.value)}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
              </Form.Select>
            </Col>
            <Col sm={9}>
              <Form.Label htmlFor="rv-text">Your review (optional)</Form.Label>
              <Form.Control id="rv-text" as="textarea" rows={2} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
            </Col>
          </Row>
          <div className="mt-3 d-flex gap-2">
            <Button type="submit" variant="danger" size="sm" disabled={busy}>{editing ? 'Save changes' : 'Post review'}</Button>
            {editing && <Button variant="outline-secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>}
          </div>
        </Form>
      )}
      {!user && <p className="text-secondary"><Link to="/login" className="im-link">Log in</Link> to write a review.</p>}
      {loading && <Loader label="Loading reviews…" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && reviews.length === 0 && <EmptyState title="No reviews yet" message="Be the first to share what you thought." />}
      <ul className="im-reviews">
        {reviews.map((r) => (
          <li key={r._id}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>{r.user?.username || 'Someone'}</strong>
                <span className="im-rating ms-2"><FiStar aria-hidden="true" /> {r.rating}/5</span>
              </div>
              <div className="d-flex gap-2">
                {user && r.user?._id === user._id && !editing && <Button size="sm" variant="outline-light" onClick={startEdit}>Edit</Button>}
                {user && (r.user?._id === user._id || isAdmin) && (
                  <Button size="sm" variant="outline-danger" onClick={() => remove(r._id)} aria-label="Delete review"><FiTrash2 /></Button>
                )}
              </div>
            </div>
            {r.text && <p className="mb-0 mt-1">{r.text}</p>}
            <small className="text-secondary">{formatDate(r.createdAt)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const favs = useFavorites();
  const movie = useFetch(() => moviesApi.get(id), [id]);
  const shows = useFetch(() => showsApi.forMovie(id), [id]);

  if (movie.loading && !movie.data) return <Loader fullPage label="Loading movie…" />;
  if (movie.error || !movie.data) return <Container className="py-5"><ErrorState message={movie.error} onRetry={movie.reload} /></Container>;
  const m = movie.data.data;
  const showList = shows.data?.data || [];
  const fav = favs?.isFavorite(m._id);

  const byDate = showList.reduce((acc, s) => { (acc[s.date] ||= []).push(s); return acc; }, {});

  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col md={4} lg={3}>
          <PosterImage src={m.posterUrl} alt={`${m.name} poster`} className="im-detail-poster" />
        </Col>
        <Col md={8} lg={9}>
          <h1 className="im-detail-title">{m.name}</h1>
          <p className="im-detail-meta">
            <Badge bg="danger">{m.certificate}</Badge>
            <span>{formatDuration(m.duration)}</span>
            <span>{m.language}</span>
            <span>Released {formatDate(m.releaseDate)}</span>
          </p>
          <p className="mb-2">{m.genres.map((g) => <Badge key={g} bg="secondary" className="me-1">{g}</Badge>)}</p>
          <p className="im-rating-big">
            <FiStar aria-hidden="true" /> {m.rating ? `${m.rating} / 5` : 'Not rated yet'}
            <small> ({m.reviewCount} review{m.reviewCount === 1 ? '' : 's'})</small>
          </p>
          <p className="im-description">{m.description}</p>
          <div className="d-flex flex-wrap gap-2">
            {showList.length > 0 && !isAdmin && (
              <Button as={Link} to={`/movies/${m._id}/shows`} variant="danger">Book tickets</Button>
            )}
            {m.trailerUrl && <Button as="a" href={m.trailerUrl} target="_blank" rel="noopener noreferrer" variant="outline-light"><FiPlay /> Watch trailer</Button>}
            {user && !isAdmin && (
              <Button variant="outline-light" onClick={() => favs.toggle(m._id)} aria-pressed={!!fav}>
                {fav ? <><FaHeart className="text-danger" /> Saved</> : <><FiHeart /> Save to favorites</>}
              </Button>
            )}
            {isAdmin && <Button as={Link} to={`/admin/movies/${m._id}/edit`} variant="outline-light">Edit movie</Button>}
          </div>
        </Col>
      </Row>

      <section className="mt-5" aria-labelledby="shows-h">
        <h2 id="shows-h" className="h4">Available shows</h2>
        {shows.loading && <Loader label="Loading shows…" />}
        {shows.error && <ErrorState message={shows.error} onRetry={shows.reload} />}
        {!shows.loading && !shows.error && showList.length === 0 && <EmptyState title="No upcoming shows" message="Check back soon — showtimes for this movie haven't been scheduled." />}
        {Object.entries(byDate).map(([date, list]) => (
          <div key={date} className="im-showday">
            <h3 className="h6">{formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
            <div className="d-flex flex-wrap gap-2">
              {list.map((s) => (
                <Button
                  key={s._id}
                  variant="outline-light"
                  className="im-showbtn"
                  disabled={isAdmin || s.availableSeats === 0}
                  onClick={() => navigate(`/movies/${m._id}/shows?show=${s._id}`)}
                >
                  <strong>{formatTime(s.time)}</strong>
                  <small>{s.theatre?.name}</small>
                  <small>{s.availableSeats === 0 ? 'Sold out' : `${s.availableSeats} seats · from ${formatINR(Math.min(...s.sections.map((x) => x.price)))}`}</small>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <Reviews movieId={m._id} onChanged={movie.reload} />
    </Container>
  );
}
