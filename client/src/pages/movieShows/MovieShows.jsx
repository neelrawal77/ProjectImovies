import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Alert } from 'react-bootstrap';
import { FiCheckCircle, FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';
import SeatMap from '../../components/SeatMap.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { EmptyState, ErrorState } from '../../components/StateViews.jsx';
import useFetch from '../../hooks/useFetch.js';
import { moviesApi, showsApi, bookingsApi, getErrorMessage } from '../../services/api.js';
import { formatDate, formatTime, formatINR } from '../../utils/format.js';

const MAX_SEATS = 10;

function Confirmation({ booking, movieName }) {
  return (
    <div className="im-panel im-confirm" role="status">
      <FiCheckCircle size={44} className="text-success" aria-hidden="true" />
      <h2 className="h3 mt-2">Booking confirmed</h2>
      <p className="text-secondary">Demo payment accepted — no real money was charged.</p>
      <div className="im-booking-id">{booking.bookingId}</div>
      <dl className="im-dl">
        <dt>Movie</dt><dd>{movieName}</dd>
        <dt>Theatre</dt><dd>{booking.show.theatre?.name}, {booking.show.theatre?.location}</dd>
        <dt>When</dt><dd>{formatDate(booking.show.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at {formatTime(booking.show.time)}</dd>
        <dt>Seats</dt><dd>{booking.seats.map((s) => s.seatId).join(', ')}</dd>
        <dt>Total</dt><dd>{formatINR(booking.totalAmount)}</dd>
      </dl>
      <div className="d-flex flex-wrap gap-2 justify-content-center">
        <Button as={Link} to="/bookings" variant="danger">View my bookings</Button>
        <Button as={Link} to="/home" variant="outline-light">Back to home</Button>
      </div>
    </div>
  );
}

export default function MovieShows() {
  const { movieId } = useParams();
  const [params, setParams] = useSearchParams();
  const showId = params.get('show');

  const movie = useFetch(() => moviesApi.get(movieId), [movieId]);
  const shows = useFetch(() => showsApi.forMovie(movieId), [movieId]);
  const detail = useFetch(() => (showId ? showsApi.get(showId) : Promise.resolve(null)), [showId]);

  const [date, setDate] = useState('');
  const [selected, setSelected] = useState([]);
  const [outcome, setOutcome] = useState('success');
  const [busy, setBusy] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmed, setConfirmed] = useState(null);

  const list = shows.data?.data || [];
  const dates = useMemo(() => [...new Set(list.map((s) => s.date))], [list]);

  // default the date tab to the selected show's date, else the first date
  useEffect(() => {
    if (!dates.length) return;
    const current = list.find((s) => s._id === showId);
    setDate((d) => (d && dates.includes(d) ? d : current?.date || dates[0]));
  }, [dates, list, showId]);

  useEffect(() => { setSelected([]); setBookingError(''); }, [showId]);

  const show = detail.data?.data;
  const toggleSeat = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const priceOf = (id) => show?.seats.find((s) => s.id === id)?.price || 0;
  const estimate = selected.reduce((t, id) => t + priceOf(id), 0);

  const pickShow = (id) => setParams({ show: id });

  const book = async () => {
    setBusy(true);
    setBookingError('');
    try {
      const res = await bookingsApi.create({ showId, seats: selected, demoPaymentOutcome: outcome });
      setConfirmed(res.data);
      toast.success('Booking confirmed!');
    } catch (err) {
      const msg = getErrorMessage(err, 'Booking failed');
      setBookingError(msg);
      toast.error(msg);
      setSelected([]);
      detail.reload(); // seat map may have changed
    } finally {
      setBusy(false);
    }
  };

  if (movie.loading && !movie.data) return <Loader fullPage label="Loading…" />;
  if (movie.error) return <Container className="py-5"><ErrorState message={movie.error} onRetry={movie.reload} /></Container>;
  const m = movie.data.data;

  if (confirmed) return <Container className="py-4" style={{ maxWidth: 640 }}><Confirmation booking={confirmed} movieName={m.name} /></Container>;

  const dayShows = list.filter((s) => s.date === date);
  const byTheatre = dayShows.reduce((acc, s) => { (acc[s.theatre?._id] ||= { theatre: s.theatre, shows: [] }).shows.push(s); return acc; }, {});

  return (
    <Container className="py-4">
      <header className="im-page-head">
        <p className="mb-1"><Link to={`/movies/${m._id}`} className="im-link">← {m.name}</Link></p>
        <h1>Choose a show and seats</h1>
      </header>

      {shows.loading && !shows.data && <Loader label="Loading showtimes…" />}
      {shows.error && <ErrorState message={shows.error} onRetry={shows.reload} />}
      {!shows.loading && !shows.error && list.length === 0 && <EmptyState title="No upcoming shows" message="This movie has no scheduled showtimes yet." action={<Button as={Link} to="/movies" size="sm" variant="danger">Browse other movies</Button>} />}

      {list.length > 0 && (
        <>
          <div className="im-chips" role="tablist" aria-label="Show dates">
            {dates.map((d) => (
              <button key={d} role="tab" aria-selected={d === date} type="button" className={`im-chip ${d === date ? 'on' : ''}`} onClick={() => setDate(d)}>
                {formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}
              </button>
            ))}
          </div>

          <div className="im-theatres">
            {Object.values(byTheatre).map(({ theatre, shows: ss }) => (
              <div key={theatre?._id} className="im-theatre-row">
                <div><strong>{theatre?.name}</strong><small className="d-block text-secondary">{theatre?.location}</small></div>
                <div className="d-flex flex-wrap gap-2">
                  {ss.map((s) => (
                    <Button key={s._id} size="sm" variant={s._id === showId ? 'danger' : 'outline-light'} disabled={s.availableSeats === 0} onClick={() => pickShow(s._id)} aria-pressed={s._id === showId}>
                      {formatTime(s.time)}{s.availableSeats === 0 ? ' · sold out' : ''}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showId && (
        <section className="mt-4" aria-label="Seat selection">
          {detail.loading && !show && <Loader label="Loading seat map…" />}
          {detail.error && <ErrorState message={detail.error} onRetry={detail.reload} />}
          {show && (
            <Row className="g-4">
              <Col lg={8}>
                <div className="im-panel">
                  <h2 className="h5">{show.theatre?.name} · {formatDate(show.date)} · {formatTime(show.time)}</h2>
                  <p className="text-secondary small">{show.availableSeats} of {show.totalSeats} seats available. Pick up to {MAX_SEATS}.</p>
                  <SeatMap seats={show.seats} selected={selected} onToggle={toggleSeat} max={MAX_SEATS} />
                </div>
              </Col>
              <Col lg={4}>
                <div className="im-panel im-summary">
                  <h2 className="h5">Your booking</h2>
                  {selected.length === 0 ? (
                    <p className="text-secondary">Select seats on the map to continue.</p>
                  ) : (
                    <>
                      <ul className="im-seatlist">
                        {selected.map((id) => <li key={id}><span>Seat {id}</span><span>{formatINR(priceOf(id))}</span></li>)}
                      </ul>
                      <div className="im-total"><span>Total</span><strong>{formatINR(estimate)}</strong></div>
                      <small className="text-secondary">The final amount is calculated by the server.</small>
                    </>
                  )}

                  <Alert variant="warning" className="mt-3 py-2 small">
                    <FiInfo aria-hidden="true" /> <strong>Demo payment.</strong> No real payment is processed and no card details are collected.
                  </Alert>
                  <Form.Group className="mb-3">
                    <Form.Label className="small">Simulate the payment result</Form.Label>
                    <Form.Check type="radio" id="pay-ok" name="outcome" label="Payment succeeds" checked={outcome === 'success'} onChange={() => setOutcome('success')} />
                    <Form.Check type="radio" id="pay-fail" name="outcome" label="Payment fails (seats are released)" checked={outcome === 'failure'} onChange={() => setOutcome('failure')} />
                  </Form.Group>
                  {bookingError && <Alert variant="danger" className="py-2 small" role="alert">{bookingError}</Alert>}
                  <Button variant="danger" className="w-100" disabled={busy || selected.length === 0} onClick={book}>
                    {busy ? 'Processing demo payment…' : `Pay ${selected.length ? formatINR(estimate) : ''} (demo)`}
                  </Button>
                </div>
              </Col>
            </Row>
          )}
        </section>
      )}
    </Container>
  );
}
