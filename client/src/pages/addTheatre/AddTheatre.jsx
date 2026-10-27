import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader/Loader.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import useFetch from '../../hooks/useFetch.js';
import { theatresApi, getErrorMessage } from '../../services/api.js';
import { validateTheatre } from '../../utils/validators.js';
import { formatINR } from '../../utils/format.js';

const newSection = () => ({ name: '', rows: 3, seatsPerRow: 10, price: 200 });

export default function AddTheatre() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const existing = useFetch(() => (editing ? theatresApi.get(id) : Promise.resolve(null)), [id]);
  const [form, setForm] = useState({ name: '', location: '', theatreCode: '', sections: [{ ...newSection(), name: 'Standard' }] });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = existing.data?.data;
    if (t) setForm({ name: t.name, location: t.location, theatreCode: t.theatreCode, sections: t.sections.map((s) => ({ ...s })) });
  }, [existing.data]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setSection = (i, k, v) => setForm((f) => ({ ...f, sections: f.sections.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));
  const addSection = () => setForm((f) => ({ ...f, sections: [...f.sections, newSection()] }));
  const removeSection = (i) => setForm((f) => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }));
  const total = form.sections.reduce((t, s) => t + (Number(s.rows) || 0) * (Number(s.seatsPerRow) || 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    const v = validateTheatre(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setServerError('');
    const body = {
      name: form.name.trim(), location: form.location.trim(), theatreCode: form.theatreCode.trim().toUpperCase(),
      sections: form.sections.map((s) => ({ name: s.name.trim(), rows: Number(s.rows), seatsPerRow: Number(s.seatsPerRow), price: Number(s.price) })),
    };
    try {
      if (editing) await theatresApi.update(id, body); else await theatresApi.create(body);
      toast.success(editing ? 'Theatre updated' : 'Theatre added');
      navigate('/admin');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally { setBusy(false); }
  };

  if (editing && existing.loading && !existing.data) return <Loader label="Loading theatre…" />;
  if (existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;

  return (
    <Form onSubmit={submit} noValidate className="im-panel">
      <h1 className="h3 mb-1">{editing ? 'Edit theatre' : 'Add a theatre'}</h1>
      {editing && <p className="text-secondary small">Changes affect shows created from now on; existing shows keep their original layout and prices.</p>}
      {serverError && <Alert variant="danger" role="alert">{serverError}</Alert>}
      <Row className="g-3">
        <Col md={5}>
          <Form.Label htmlFor="th-name">Theatre name</Form.Label>
          <Form.Control id="th-name" value={form.name} onChange={set('name')} isInvalid={!!errors.name} maxLength={100} />
          <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
        </Col>
        <Col md={5}>
          <Form.Label htmlFor="th-loc">Location</Form.Label>
          <Form.Control id="th-loc" value={form.location} onChange={set('location')} isInvalid={!!errors.location} maxLength={150} />
          <Form.Control.Feedback type="invalid">{errors.location}</Form.Control.Feedback>
        </Col>
        <Col md={2}>
          <Form.Label htmlFor="th-code">Identifier</Form.Label>
          <Form.Control id="th-code" value={form.theatreCode} onChange={set('theatreCode')} isInvalid={!!errors.theatreCode} maxLength={12} placeholder="IM-STAR" />
          <Form.Control.Feedback type="invalid">{errors.theatreCode}</Form.Control.Feedback>
        </Col>
      </Row>

      <h2 className="h5 mt-4">Seat sections <small className="text-secondary">· {total} seats in total</small></h2>
      {errors.sections && <div className="text-danger small mb-2">{errors.sections}</div>}
      {form.sections.map((s, i) => (
        <Row key={i} className="g-2 align-items-end mb-2 im-section-row">
          <Col sm={4}><Form.Label htmlFor={`s-name-${i}`} className="small">Name</Form.Label><Form.Control id={`s-name-${i}`} value={s.name} onChange={(e) => setSection(i, 'name', e.target.value)} maxLength={30} /></Col>
          <Col xs={4} sm={2}><Form.Label htmlFor={`s-rows-${i}`} className="small">Rows</Form.Label><Form.Control id={`s-rows-${i}`} type="number" min={1} max={26} value={s.rows} onChange={(e) => setSection(i, 'rows', e.target.value)} /></Col>
          <Col xs={4} sm={2}><Form.Label htmlFor={`s-spr-${i}`} className="small">Seats/row</Form.Label><Form.Control id={`s-spr-${i}`} type="number" min={1} max={30} value={s.seatsPerRow} onChange={(e) => setSection(i, 'seatsPerRow', e.target.value)} /></Col>
          <Col xs={4} sm={3}><Form.Label htmlFor={`s-price-${i}`} className="small">Price (₹)</Form.Label><Form.Control id={`s-price-${i}`} type="number" min={1} value={s.price} onChange={(e) => setSection(i, 'price', e.target.value)} /><small className="text-secondary">{formatINR(s.price)}</small></Col>
          <Col sm={1} className="text-end"><Button variant="outline-danger" size="sm" onClick={() => removeSection(i)} disabled={form.sections.length === 1} aria-label={`Remove section ${i + 1}`}><FiTrash2 /></Button></Col>
        </Row>
      ))}
      <Button variant="outline-light" size="sm" onClick={addSection} disabled={form.sections.length >= 5}><FiPlus /> Add section</Button>

      <div className="mt-4 d-flex gap-2">
        <Button type="submit" variant="danger" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add theatre'}</Button>
        <Button variant="outline-secondary" onClick={() => navigate('/admin')}>Cancel</Button>
      </div>
    </Form>
  );
}
