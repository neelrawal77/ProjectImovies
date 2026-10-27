import { Link } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import MovieCard from '../../components/MovieCard/MovieCard.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { EmptyState, ErrorState } from '../../components/StateViews.jsx';
import useFetch from '../../hooks/useFetch.js';
import { favoritesApi } from '../../services/api.js';

export default function Favorites() {
  const { data, loading, error, reload } = useFetch(() => favoritesApi.list(), []);
  const favs = data?.data || [];

  return (
    <Container className="py-4">
      <header className="im-page-head">
        <h1>Your favorites</h1>
        <p>Movies you saved to watch later.</p>
      </header>
      {loading && <Loader label="Loading favorites…" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && favs.length === 0 && (
        <EmptyState title="No favorites yet" message="Tap the heart on any movie to save it here." action={<Button as={Link} to="/movies" variant="danger" size="sm">Browse movies</Button>} />
      )}
      {favs.length > 0 && (
        <div className="im-grid">
          {favs.map((f) => <MovieCard key={f._id} movie={f.movie} onRemoveFavorite={reload} />)}
        </div>
      )}
    </Container>
  );
}
