import { Container } from 'react-bootstrap';
import MovieCatalogue from '../../components/MovieCatalogue.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();
  return (
    <Container className="py-4">
      <header className="im-page-head">
        <h1>{user ? `Hi ${user.username}, what are we watching?` : 'Now showing'}</h1>
        <p>Search the catalogue or filter by genre, then open a movie to see showtimes.</p>
      </header>
      <MovieCatalogue pageSize={8} />
    </Container>
  );
}
