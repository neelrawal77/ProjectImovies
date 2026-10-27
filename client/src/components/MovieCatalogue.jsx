import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Row, Col, Button, Pagination } from 'react-bootstrap';
import { FiSearch } from 'react-icons/fi';
import MovieCard from './MovieCard/MovieCard.jsx';
import Loader from './Loader/Loader.jsx';
import { EmptyState, ErrorState } from './StateViews.jsx';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import { moviesApi } from '../services/api.js';

/** Search + genre filters + paged grid. Used by Home (compact) and Movies (full). */
export default function MovieCatalogue({ pageSize = 12, showLanguage = false, initialGenre = '' }) {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState(initialGenre);
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  useEffect(() => setPage(1), [debounced, genre, language]);

  const genres = useFetch(() => moviesApi.genres(), []);
  const movies = useFetch(
    () => moviesApi.list({ search: debounced || undefined, genre: genre || undefined, language: language || undefined, page, limit: pageSize }),
    [debounced, genre, language, page, pageSize]
  );
  const languages = useFetch(() => moviesApi.list({ limit: 100 }), []);
  const langOptions = [...new Set((languages.data?.data || []).map((m) => m.language))].sort();
  const pages = movies.data?.pagination?.pages || 1;
  const clear = () => { setSearch(''); setGenre(''); setLanguage(''); };

  return (
    <div>
      <Row className="g-3 align-items-end mb-3">
        <Col md={showLanguage ? 6 : 8}>
          <Form.Label htmlFor="movie-search" className="visually-hidden">Search movies</Form.Label>
          <div className="im-search">
            <FiSearch aria-hidden="true" />
            <Form.Control id="movie-search" type="search" placeholder="Search movies by name…" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} />
          </div>
        </Col>
        {showLanguage && (
          <Col md={3}>
            <Form.Select aria-label="Filter by language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">All languages</option>
              {langOptions.map((l) => <option key={l}>{l}</option>)}
            </Form.Select>
          </Col>
        )}
        <Col md={showLanguage ? 3 : 4} className="text-md-end">
          {(search || genre || language) && <Button variant="outline-light" size="sm" onClick={clear}>Clear filters</Button>}
        </Col>
      </Row>

      <div className="im-chips" role="group" aria-label="Filter by genre">
        <button type="button" className={`im-chip ${genre === '' ? 'on' : ''}`} onClick={() => setGenre('')}>All</button>
        {(genres.data?.data || []).map((g) => (
          <button key={g} type="button" className={`im-chip ${genre === g ? 'on' : ''}`} onClick={() => setGenre(g)} aria-pressed={genre === g}>{g}</button>
        ))}
      </div>

      {movies.loading && <Loader label="Loading movies…" />}
      {movies.error && <ErrorState message={movies.error} onRetry={movies.reload} />}
      {!movies.loading && !movies.error && movies.data?.data.length === 0 && (
        <EmptyState title="No movies found" message="Try a different search or genre." action={<Button variant="danger" size="sm" onClick={clear}>Clear filters</Button>} />
      )}
      {!movies.error && movies.data?.data.length > 0 && (
        <div className="im-grid">
          {movies.data.data.map((m) => <MovieCard key={m._id} movie={m} />)}
        </div>
      )}
      {pages > 1 && (
        <Pagination className="justify-content-center mt-4 im-pagination">
          <Pagination.Prev disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
          {Array.from({ length: pages }, (_, i) => (
            <Pagination.Item key={i + 1} active={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</Pagination.Item>
          ))}
          <Pagination.Next disabled={page >= pages} onClick={() => setPage((p) => p + 1)} />
        </Pagination>
      )}
      {pageSize < 100 && !showLanguage && movies.data?.pagination?.total > pageSize && (
        <p className="text-center mt-3"><Link to="/movies" className="im-link">Browse all {movies.data.pagination.total} movies</Link></p>
      )}
    </div>
  );
}
