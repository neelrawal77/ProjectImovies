import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader/Loader.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import useFetch from '../../hooks/useFetch.js';
import { moviesApi, theatresApi, showsApi, getErrorMessage } from '../../services/api.js';
import { validateShow } from '../../utils/validators.js';
import { todayISO } from '../../utils/format.js';

export default function AddShow() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const movies = useFetch(() => moviesApi.list({ limit: 100, sort: 'name' }), []);
  const theatres = useFetch(() => theatresApi.list(), []);
  const existing = useFetch(() => (editing ? showsApi.get(id) : Promise.resolve(null)), [id]);
  const [form, setForm] = useState({ movie: '', theatre: '', date: '', time: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = existing.data?.data;
    if (s) setForm({ movie: s.movie._id, theatre: s.theatre._id, date: s.date, time: s.time });
  }, [existing.data]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const hasBookings = editing && (existing.data?.data?.bookedSeats?.length || 0) > 0;

  const submit = async (e) => {
    e.preventDefault();
    const v = validateShow(form, { editing });
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setServerError('');
    try {
      if (editing) await showsApi.update(id, form); else await showsApi.create(form);
      toast.success(editing ? 'Show updated' : 'Show added');
      navigate('/admin');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally { setBusy(false); }
  };

  const loading = (movies.loading && !movies.data) || (theatres.loading && !theatres.data) || (editing && existing.loading && !existing.data);
  if (loading) return <Loader label="Loading…" />;
  const err = movies.error || theatres.error || existing.error;
  if (err) return <ErrorState message={err} onRetry={() => { movies.reload(); theatres.reload(); existing.reload(); }} />;

  const movieList = movies.data.data;
  const theatreList = theatres.data.data;
  if (movieList.length === 0 || theatreList.length === 0) {
    return (
      <Alert variant="warning">
        You need at least one movie and one theatre before scheduling a show.{' '}
        <Link to="/admin/movies/new" className="alert-link">Add a movie</Link> · <Link to="/admin/theatres/new" className="alert-link">Add a theatre</Link>
      </Alert>
    );
  }

  return (
    <Form onSubmit={submit} noValidate className="im-panel">
      <h1 className="h3 mb-3">{editing ? 'Edit show' : 'Add a show'}</h1>
      {hasBookings && <Alert variant="info" className="py-2 small">Seats are already booked for this show, so the theatre can't be changed.</Alert>}
      {serverError && <Alert variant="danger" role="alert">{serverError}</Alert>}
      <Row className="g-3">
        <Col md={6}>
          <Form.Label htmlFor="sh-movie">Movie</Form.Label>
          <Form.Select id="sh-movie" value={form.movie} onChange={set('movie')} isInvalid={!!errors.movie}>
            <option value="">Select a movie…</option>
            {movieList.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errors.movie}</Form.Control.Feedback>
        </Col>
        <Col md={6}>
          <Form.Label htmlFor="sh-theatre">Theatre</Form.Label>
          <Form.Select id="sh-theatre" value={form.theatre} onChange={set('theatre')} isInvalid={!!errors.theatre} disabled={hasBookings}>
            <option value="">Select a theatre…</option>
            {theatreList.map((t) => <option key={t._id} value={t._id}>{t.name} — {t.location}</option>)}
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errors.theatre}</Form.Control.Feedback>
        </Col>
        <Col md={6}>
          <Form.Label htmlFor="sh-date">Date</Form.Label>
          <Form.Control id="sh-date" type="date" min={editing ? undefined : todayISO()} value={form.date} onChange={set('date')} isInvalid={!!errors.date} />
          <Form.Control.Feedback type="invalid">{errors.date}</Form.Control.Feedback>
        </Col>
        <Col md={6}>
          <Form.Label htmlFor="sh-time">Time</Form.Label>
          <Form.Control id="sh-time" type="time" value={form.time} onChange={set('time')} isInvalid={!!errors.time} />
          <Form.Control.Feedback type="invalid">{errors.time}</Form.Control.Feedback>
        </Col>
      </Row>
      <p className="text-secondary small mt-3 mb-0">Seat layout and prices are copied from the theatre when the show is created. Times use the server's time zone.</p>
      <div className="mt-4 d-flex gap-2">
        <Button type="submit" variant="danger" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add show'}</Button>
        <Button variant="outline-secondary" onClick={() => navigate('/admin')}>Cancel</Button>
      </div>
    </Form>
  );
}
