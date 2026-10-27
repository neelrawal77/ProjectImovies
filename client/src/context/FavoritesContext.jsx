import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { favoritesApi, getErrorMessage } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());

  useEffect(() => {
    if (!user) { setIds(new Set()); return; }
    favoritesApi.ids().then((r) => setIds(new Set(r.data))).catch(() => setIds(new Set()));
  }, [user]);

  const toggle = useCallback(async (movieId) => {
    const has = ids.has(movieId);
    try {
      if (has) await favoritesApi.remove(movieId); else await favoritesApi.add(movieId);
      setIds((prev) => {
        const next = new Set(prev);
        if (has) next.delete(movieId); else next.add(movieId);
        return next;
      });
      toast.success(has ? 'Removed from favorites' : 'Added to favorites');
      return !has;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return has;
    }
  }, [ids]);

  const value = useMemo(() => ({ ids, toggle, isFavorite: (id) => ids.has(id) }), [ids, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
