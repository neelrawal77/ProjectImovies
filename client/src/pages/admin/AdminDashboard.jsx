import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Tabs, Tab, Table, Button, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader/Loader.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { EmptyState, ErrorState } from '../../components/StateViews.jsx';
import useFetch from '../../hooks/useFetch.js';
import { adminApi, moviesApi, theatresApi, showsApi, getErrorMessage } from '../../services/api.js';
import { formatDate, formatTime, formatINR } from '../../utils/format.js';
import { STATUS_VARIANT, STATUS_LABEL } from '../bookings/Bookings.jsx';

const Stat = ({ label, value }) => (
  <Col xs={6} md={4} xl={3}><div className="im-stat"><strong>{value}</strong><span>{label}</span></div></Col>
);

export default function AdminDashboard() {
  const stats = useFetch(() => adminApi.stats(), []);
  const movies = useFetch(() => moviesApi.list({ limit: 100, sort: 'name' }), []);
  const theatres = useFetch(() => theatresApi.list(), []);
  const shows = useFetch(() => showsApi.list({ upcoming: 'true' }), []);
  const [del, setDel] = useState(null); // { kind, item }
  const [busy, setBusy] = useState(false);

  const api = { movie: moviesApi, theatre: theatresApi, show: showsApi };
  const reloaders = { movie: movies.reload, theatre: theatres.reload, show: shows.reload };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api[del.kind].remove(del.item._id);
      toast.success(`${del.kind[0].toUpperCase()}${del.kind.slice(1)} deleted`);
      reloaders[del.kind]();
      stats.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setBusy(false); setDel(null); }
  };

  const s = stats.data?.data;

  return (
    <div>
      <header className="im-page-head">
        <h1>Admin dashboard</h1>
        <p>Overview and management of movies, theatres, shows and bookings.</p>
      </header>

      {stats.loading && !s && <Loader label="Loading statistics…" />}
      {stats.error && <ErrorState message={stats.error} onRetry={stats.reload} />}
      {s && (
        <>
          <Row className="g-3 mb-4">
            <Stat label="Movies" value={s.movies} />
            <Stat label="Theatres" value={s.theatres} />
            <Stat label="Upcoming shows" value={s.upcomingShows} />
            <Stat label="Customers" value={s.users} />
            <Stat label="Bookings" value={s.bookings} />
            <Stat label="Confirmed" value={s.bookingsByStatus.confirmed} />
            <Stat label="Seats sold" value={s.seatsSold} />
            <Stat label="Demo revenue" value={formatINR(s.demoRevenue)} />
          </Row>
          <h2 className="h5">Recent bookings</h2>
          {s.recentBookings.length === 0 ? <p className="text-secondary">No bookings yet.</p> : (
            <div className="table-responsive mb-4">
              <Table variant="dark" hover size="sm" className="align-middle">
                <thead><tr><th>ID</th><th>Customer</th><th>Movie</th><th>Seats</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {s.recentBookings.map((b) => (
                    <tr key={b._id}>
                      <td><code>{b.bookingId}</code></td><td>{b.user?.username}</td><td>{b.show?.movie?.name}</td>
                      <td>{b.seats.map((x) => x.seatId).join(', ')}</td><td>{formatINR(b.totalAmount)}</td>
                      <td><Badge bg={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </>
      )}

      <Tabs defaultActiveKey="movies" className="mb-3 im-tabs" justify>
        <Tab eventKey="movies" title={`Movies (${movies.data?.pagination?.total ?? '…'})`}>
          <div className="d-flex justify-content-end mb-2"><Button as={Link} to="/admin/movies/new" size="sm" variant="danger">Add movie</Button></div>
          {movies.error && <ErrorState message={movies.error} onRetry={movies.reload} />}
          {movies.data?.data.length === 0 && <EmptyState title="No movies" message="Add your first movie." />}
          <div className="table-responsive">
            <Table variant="dark" hover size="sm" className="align-middle">
              <tbody>
                {(movies.data?.data || []).map((m) => (
                  <tr key={m._id}>
                    <td><Link to={`/movies/${m._id}`} className="im-link">{m.name}</Link></td>
                    <td>{m.genres.join(', ')}</td><td>{m.language}</td>
                    <td className="text-end text-nowrap">
                      <Button as={Link} to={`/admin/movies/${m._id}/edit`} size="sm" variant="outline-light" className="me-1">Edit</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => setDel({ kind: 'movie', item: m })}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
        <Tab eventKey="theatres" title={`Theatres (${theatres.data?.data.length ?? '…'})`}>
          <div className="d-flex justify-content-end mb-2"><Button as={Link} to="/admin/theatres/new" size="sm" variant="danger">Add theatre</Button></div>
          {theatres.error && <ErrorState message={theatres.error} onRetry={theatres.reload} />}
          {theatres.data?.data.length === 0 && <EmptyState title="No theatres" message="Add a theatre before scheduling shows." />}
          <div className="table-responsive">
            <Table variant="dark" hover size="sm" className="align-middle">
              <tbody>
                {(theatres.data?.data || []).map((t) => (
                  <tr key={t._id}>
                    <td><strong>{t.name}</strong> <code>{t.theatreCode}</code></td><td>{t.location}</td><td>{t.totalSeats} seats</td>
                    <td className="text-end text-nowrap">
                      <Button as={Link} to={`/admin/theatres/${t._id}/edit`} size="sm" variant="outline-light" className="me-1">Edit</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => setDel({ kind: 'theatre', item: t })}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
        <Tab eventKey="shows" title={`Upcoming shows (${shows.data?.data.length ?? '…'})`}>
          <div className="d-flex justify-content-end mb-2"><Button as={Link} to="/admin/shows/new" size="sm" variant="danger">Add show</Button></div>
          {shows.error && <ErrorState message={shows.error} onRetry={shows.reload} />}
          {shows.data?.data.length === 0 && <EmptyState title="No upcoming shows" message="Schedule a show for a movie." />}
          <div className="table-responsive">
            <Table variant="dark" hover size="sm" className="align-middle">
              <tbody>
                {(shows.data?.data || []).map((sh) => (
                  <tr key={sh._id}>
                    <td>{sh.movie?.name}</td><td>{sh.theatre?.name}</td>
                    <td>{formatDate(sh.date)} · {formatTime(sh.time)}</td>
                    <td>{sh.totalSeats - sh.availableSeats}/{sh.totalSeats} sold</td>
                    <td className="text-end text-nowrap">
                      <Button as={Link} to={`/admin/shows/${sh._id}/edit`} size="sm" variant="outline-light" className="me-1">Edit</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => setDel({ kind: 'show', item: sh })}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>

      <ConfirmModal show={!!del} title={`Delete this ${del?.kind}?`} confirmLabel="Delete" busy={busy} onConfirm={confirmDelete} onCancel={() => setDel(null)}>
        <strong>{del?.item?.name || `${del?.item?.movie?.name} at ${del?.item?.theatre?.name}`}</strong> will be permanently removed. Items that are still in use (for example a movie with shows) cannot be deleted.
      </ConfirmModal>
    </div>
  );
}
