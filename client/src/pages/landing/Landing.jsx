import { Link, Navigate } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { FiArrowRight, FiCalendar, FiFilm, FiMapPin, FiPlay } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />;

  return (
    <>
      <section className="im-cinema-hero">
        <div className="im-cinema-backdrop" aria-hidden="true" />
        <Container className="im-cinema-content">
          <div className="im-cinema-copy">
            <span className="im-hero-kicker"><FiFilm /> Now showing</span>
            <h1>Every great movie deserves the perfect seat.</h1>
            <p>Discover what is playing, choose your theatre, and book in a few taps.</p>
            <div className="im-hero-actions">
              <Button as={Link} to="/movies" variant="danger" size="lg"><FiPlay /> Explore movies</Button>
              <Button as={Link} to="/register" variant="light" size="lg">Get started <FiArrowRight /></Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="im-booking-flow">
        <Container>
          <div className="im-flow-grid">
            <div><span>01</span><FiFilm /><strong>Find a movie</strong><p>Browse this week's biggest releases.</p></div>
            <div><span>02</span><FiMapPin /><strong>Pick a theatre</strong><p>Choose your city, cinema and showtime.</p></div>
            <div><span>03</span><FiCalendar /><strong>Book your seats</strong><p>Select seats and confirm instantly.</p></div>
          </div>
        </Container>
      </section>
    </>
  );
}
