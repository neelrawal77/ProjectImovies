import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader/Loader.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import useFetch from '../../hooks/useFetch.js';
import { moviesApi, getErrorMessage } from '../../services/api.js';
import { validateMovie } from '../../utils/validators.js';
import { GENRES, CERTIFICATES } from '../../utils/format.js';

const EMPTY = { name: '', description: '', genres: [], releaseDate: '', duration: '', language: '', certificate: 'U/A', posterUrl: '', trailerUrl: '' };

export default function AddMovie() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const existing = useFetch(() => (editing ? moviesApi.get(id) : Promise.resolve(null)), [id]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const m = existing.data?.data;
    if (m) setForm({ ...EMPTY, ...m, releaseDate: m.releaseDate?.slice(0, 10) || '', duration: String(m.duration) });
    else if (!editing) setForm(EMPTY);
  }, [existing.data, editing]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleGenre = (g) => setForm((f) => ({ ...f, genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g] }));

  const submit = async (e) => {
    e.preventDefault();
    const v = validateMovie(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setServerError('');
    const body = { ...form, name: form.name.trim(), description: form.description.trim(), language: form.language.trim(), duration: Number(form.duration), posterUrl: form.posterUrl.trim(), trailerUrl: form.trailerUrl.trim() };
    delete body._id; delete body.__v; delete body.createdAt; delete body.updatedAt; delete body.rating; delete body.reviewCount;
    try {
      if (editing) await moviesApi.update(id, body); else await moviesApi.create(body);
      toast.success(editing ? 'Movie updated' : 'Movie added');
      navigate('/admin');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally { setBusy(false); }
  };

  if (editing && existing.loading && !existing.data) return <Loader label="Loading movie…" />;
  if (existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;

  return (
    <Form onSubmit={submit} noValidate className="im-panel">
      <h1 className="h3 mb-3">{editing ? 'Edit movie' : 'Add a movie'}</h1>
      {serverError && <Alert variant="danger" role="alert">{serverError}</Alert>}
      <Row className="g-3">
        <Col md={8}>
          <Form.Label htmlFor="mv-name">Movie name</Form.Label>
          <Form.Control id="mv-name" value={form.name} onChange={set('name')} isInvalid={!!errors.name} maxLength={150} />
          <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
        </Col>
        <Col md={4}>
          <Form.Label htmlFor="mv-cert">Certificate</Form.Label>
          <Form.Select id="mv-cert" value={form.certificate} onChange={set('certificate')}>{CERTIFICATES.map((c) => <option key={c}>{c}</option>)}</Form.Select>
        </Col>
        <Col xs={12}>
          <Form.Label htmlFor="mv-desc">Description</Form.Label>
          <Form.Control id="mv-desc" as="textarea" rows={4} value={form.description} onChange={set('description')} isInvalid={!!errors.description} maxLength={2000} />
          <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
        </Col>
        <Col xs={12}>
          <Form.Label as="span" id="mv-genres">Genres</Form.Label>
          <div className="im-chips mb-0" role="group" aria-labelledby="mv-genres">
            {GENRES.map((g) => (
              <button key={g} type="button" className={`im-chip ${form.genres.includes(g) ? 'on' : ''}`} onClick={() => toggleGenre(g)} aria-pressed={form.genres.includes(g)}>{g}</button>
            ))}
          </div>
          {errors.genres && <div className="text-danger small mt-1">{errors.genres}</div>}
        </Col>
        <Col md={4}>
          <Form.Label htmlFor="mv-date">Release date</Form.Label>
          <Form.Control id="mv-date" type="date" value={form.releaseDate} onChange={set('releaseDate')} isInvalid={!!errors.releaseDate} />
          <Form.Control.Feedback type="invalid">{errors.releaseDate}</Form.Control.Feedback>
        </Col>
        <Col md={4}>
          <Form.Label htmlFor="mv-dur">Duration (minutes)</Form.Label>
          <Form.Control id="mv-dur" type="number" min={1} max={600} value={form.duration} onChange={set('duration')} isInvalid={!!errors.duration} />
          <Form.Control.Feedback type="invalid">{errors.duration}</Form.Control.Feedback>
        </Col>
        <Col md={4}>
          <Form.Label htmlFor="mv-lang">Language</Form.Label>
          <Form.Control id="mv-lang" value={form.language} onChange={set('language')} isInvalid={!!errors.language} />
          <Form.Control.Feedback type="invalid">{errors.language}</Form.Control.Feedback>
        </Col>
        <Col md={6}>
          <Form.Label htmlFor="mv-poster">Poster URL (optional)</Form.Label>
          <Form.Control id="mv-poster" value={form.posterUrl} onChange={set('posterUrl')} isInvalid={!!errors.posterUrl} placeholder="https://… or /posters/my-movie.svg" />
          <Form.Control.Feedback type="invalid">{errors.posterUrl}</Form.Control.Feedback>
          <Form.Text className="text-secondary">Only use images you have the right to use. A local placeholder shows if it fails to load.</Form.Text>
        </Col>
        <Col md={6}>
          <Form.Label htmlFor="mv-trailer">Trailer URL (optional)</Form.Label>
          <Form.Control id="mv-trailer" value={form.trailerUrl} onChange={set('trailerUrl')} isInvalid={!!errors.trailerUrl} placeholder="https://…" />
          <Form.Control.Feedback type="invalid">{errors.trailerUrl}</Form.Control.Feedback>
        </Col>
      </Row>
      <div className="mt-4 d-flex gap-2">
        <Button type="submit" variant="danger" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add movie'}</Button>
        <Button variant="outline-secondary" onClick={() => navigate('/admin')}>Cancel</Button>
      </div>
    </Form>
  );
}
