import { useEffect, useState } from 'react';
import { Row, Col, Form, Table, Badge, Button, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader/Loader.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { EmptyState, ErrorState } from '../../components/StateViews.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import { bookingsApi, adminApi, getErrorMessage } from '../../services/api.js';
import { formatDate, formatTime, formatINR } from '../../utils/format.js';
import { STATUS_VARIANT, STATUS_LABEL } from '../bookings/Bookings.jsx';

export default function AdminBookings() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const q = useDebounce(search.trim());

  useEffect(() => setPage(1), [status, q]);
  const { data, loading, error, reload } = useFetch(
    () => bookingsApi.adminAll({ status: status || undefined, search: q || undefined, page, limit: 15 }),
    [status, q, page]
  );
  const list = data?.data || [];
  const pages = data?.pagination?.pages || 1;

  const cancel = async () => {
    setBusy(true);
    try {
      await adminApi.cancelBooking(target._id);
      toast.success('Booking cancelled and seats released');
      reload();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); setTarget(null); }
  };

  return (
    <div>
      <header className="im-page-head">
        <h1>Booking management</h1>
        <p>All bookings across the platform. Admins can cancel any confirmed booking.</p>
      </header>
      <Row className="g-2 mb-3">
        <Col sm={5}><Form.Control aria-label="Search by booking ID" placeholder="Search by exact booking ID (IM-…)" value={search} onChange={(e) => setSearch(e.target.value)} /></Col>
        <Col sm={4}>
          <Form.Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Form.Select>
        </Col>
      </Row>
      {loading && !data && <Loader label="Loading bookings…" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && list.length === 0 && <EmptyState title="No bookings found" message="Nothing matches these filters." />}
      {list.length > 0 && (
        <div className="table-responsive">
          <Table variant="dark" hover size="sm" className="align-middle">
            <thead><tr><th>Booking</th><th>Customer</th><th>Show</th><th>Seats</th><th>Total</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b._id}>
                  <td><code>{b.bookingId}</code><small className="d-block text-secondary">{formatDate(b.createdAt)}</small></td>
                  <td>{b.user?.username}<small className="d-block text-secondary">{b.user?.email}</small></td>
                  <td>{b.show?.movie?.name}<small className="d-block text-secondary">{b.show?.theatre?.name} · {formatDate(b.show?.date)} {formatTime(b.show?.time)}</small></td>
                  <td>{b.seats.map((s) => s.seatId).join(', ')}</td>
                  <td>{formatINR(b.totalAmount)}<small className="d-block text-secondary">{b.paymentStatus}</small></td>
                  <td><Badge bg={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge></td>
                  <td className="text-end">{b.status === 'confirmed' && <Button size="sm" variant="outline-danger" onClick={() => setTarget(b)}>Cancel</Button>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      {pages > 1 && (
        <Pagination className="justify-content-center im-pagination">
          <Pagination.Prev disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
          <Pagination.Item active>{page} / {pages}</Pagination.Item>
          <Pagination.Next disabled={page >= pages} onClick={() => setPage((p) => p + 1)} />
        </Pagination>
      )}
      <ConfirmModal show={!!target} title="Cancel this booking?" confirmLabel="Cancel booking" busy={busy} onConfirm={cancel} onCancel={() => setTarget(null)}>
        Booking <code>{target?.bookingId}</code> ({target?.seats.map((s) => s.seatId).join(', ')}) will be cancelled, the seats released and the demo payment marked refunded.
      </ConfirmModal>
    </div>
  );
}
