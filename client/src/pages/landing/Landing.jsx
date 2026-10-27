import { Link, Navigate } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />;

  return (
    <section className="im-hero">
      <Container>
        <div className="im-ticket">
          <div className="im-ticket-main">
            <h1>Welcome to iMovies</h1>
            <p className="im-tagline">Movie Ticket Booking Made Simple</p>
            <p className="im-lead">Pick a film, choose your theatre and showtime, tap your seats, and your tickets are ready. It takes about a minute.</p>
            <div className="d-flex flex-wrap gap-2">
              <Button as={Link} to="/register" variant="danger" size="lg">Create an account</Button>
              <Button as={Link} to="/login" variant="outline-light" size="lg">Log in</Button>
              <Button as={Link} to="/movies" variant="link" size="lg" className="text-light">Browse movies</Button>
            </div>
          </div>
          <div className="im-ticket-stub" aria-hidden="true">
            <span>ADMIT</span>
            <strong>ONE</strong>
            <span>demo ticket</span>
          </div>
        </div>
        <ul className="im-steps">
          <li><strong>Choose</strong> a movie from the catalogue</li>
          <li><strong>Pick</strong> a theatre and showtime</li>
          <li><strong>Select</strong> your seats on the live seat map</li>
          <li><strong>Confirm</strong> with a free demo payment</li>
        </ul>
      </Container>
    </section>
  );
}
