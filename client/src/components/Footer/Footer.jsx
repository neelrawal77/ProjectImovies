import { Container } from 'react-bootstrap';

export default function Footer() {
  return (
    <footer className="im-footer">
      <Container className="d-flex flex-column flex-md-row justify-content-between gap-2">
        <span>© {new Date().getFullYear()} iMovies — Movie Ticket Booking Made Simple</span>
        <span>Demo project: sample movies are fictional and payments are simulated — no real money moves.</span>
      </Container>
    </footer>
  );
}
