import { useSearchParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import MovieCatalogue from '../../components/MovieCatalogue.jsx';

export default function Movies() {
  const [params] = useSearchParams();
  return (
    <Container className="py-4">
      <header className="im-page-head">
        <h1>All movies</h1>
        <p>Every title currently in the catalogue.</p>
      </header>
      <MovieCatalogue pageSize={12} showLanguage initialGenre={params.get('genre') || ''} />
    </Container>
  );
}
