import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Badge, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PosterImage from '../../components/PosterImage.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { EmptyState, ErrorState } from '../../components/StateViews.jsx';
import useFetch from '../../hooks/useFetch.js';
import { bookingsApi, getErrorMessage } from '../../services/api.js';
import { formatDate, formatTime, formatINR } from '../../utils/format.js';

export const STATUS_VARIANT = { confirmed: 'success', cancelled: 'secondary', pending: 'warning', payment_failed: 'danger' };
export const STATUS_LABEL = { confirmed: 'Confirmed', cancelled: 'Cancelled', pending: 'Pending', payment_failed: 'Payment failed' };

export default function Bookings() {
  const { data, loading, error, reload } = useFetch(() => bookingsApi.mine(), []);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const bookings = data?.data || [];

  const cancel = async () => {
    setBusy(true);
    try {
      const res = await bookingsApi.cancel(target._id);
      toast.success(res.message);
      setTarget(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setTarget(null);
    } finally { setBusy(false); }
  };

  return (
    <Container className="py-4">
      <header className="im-page-head">
        <h1>My bookings</h1>
        <p>Tickets can be cancelled up to 2 hours before the show starts. All payments are demo payments.</p>
      </header>
      {loading && !data && <Loader label="Loading your bookings…" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && bookings.length === 0 && (
        <EmptyState title="No bookings yet" message="When you book tickets they will appear here." action={<Button as={Link} to="/movies" variant="danger" size="sm">Find a movie</Button>} />
      )}
      <div className="im-booking-list">
        {bookings.map((b) => (
          <article key={b._id} className="im-booking">
            <PosterImage src={b.show?.movie?.posterUrl} alt="" className="im-booking-poster" />
            <div className="im-booking-body">
              <div className="d-flex flex-wrap justify-content-between gap-2">
                <h2 className="h5 mb-0">{b.show?.movie?.name || 'Movie removed'}</h2>
                <Badge bg={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge>
              </div>
              <p className="text-secondary mb-1">{b.show?.theatre?.name} · {formatDate(b.show?.date)} · {formatTime(b.show?.time)}</p>
              <p className="mb-1">Seats: <strong>{b.seats.map((s) => s.seatId).join(', ')}</strong> · {formatINR(b.totalAmount)} · payment {b.paymentStatus} (demo)</p>
              <p className="im-booking-ref">Booking ID <code>{b.bookingId}</code></p>
              {b.status === 'confirmed' && <Button size="sm" variant="outline-danger" onClick={() => setTarget(b)}>Cancel booking</Button>}
            </div>
          </article>
        ))}
      </div>
      <ConfirmModal show={!!target} title="Cancel this booking?" confirmLabel="Cancel booking" busy={busy} onConfirm={cancel} onCancel={() => setTarget(null)}>
        Your seats ({target?.seats.map((s) => s.seatId).join(', ')}) will be released and the demo payment marked as refunded.
      </ConfirmModal>
    </Container>
  );
}
