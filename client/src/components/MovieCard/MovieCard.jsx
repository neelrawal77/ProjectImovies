import { Link } from 'react-router-dom';
import { FiHeart, FiStar } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import PosterImage from '../PosterImage.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { formatDuration } from '../../utils/format.js';

export default function MovieCard({ movie, onRemoveFavorite }) {
  const { user, isAdmin } = useAuth();
  const favs = useFavorites();
  const fav = favs?.isFavorite(movie._id);

  const onHeart = async (e) => {
    e.preventDefault();
    const nowFav = await favs.toggle(movie._id);
    if (!nowFav && onRemoveFavorite) onRemoveFavorite(movie._id);
  };

  return (
    <article className="im-card">
      <Link to={`/movies/${movie._id}`} className="im-card-link" aria-label={`${movie.name} — details`}>
        <div className="im-poster-wrap">
          <PosterImage src={movie.posterUrl} alt={`${movie.name} poster`} className="im-poster" />
          <span className="im-cert">{movie.certificate}</span>
        </div>
        <div className="im-card-body">
          <h3 className="im-card-title">{movie.name}</h3>
          <p className="im-card-meta">{movie.genres.join(', ')}</p>
          <p className="im-card-meta">
            {movie.language} · {formatDuration(movie.duration)}
            {movie.rating ? <span className="im-rating"><FiStar aria-hidden="true" /> {movie.rating}</span> : null}
          </p>
        </div>
      </Link>
      {user && !isAdmin && (
        <button type="button" className={`im-heart ${fav ? 'on' : ''}`} onClick={onHeart} aria-pressed={!!fav} aria-label={fav ? `Remove ${movie.name} from favorites` : `Add ${movie.name} to favorites`}>
          {fav ? <FaHeart /> : <FiHeart />}
        </button>
      )}
    </article>
  );
}
