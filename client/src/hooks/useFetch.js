import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api.js';

/** Runs an async loader; exposes { data, loading, error, reload }. Re-runs when `deps` change. */
export default function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    loader()
      .then((res) => active && setState({ data: res, loading: false, error: '' }))
      .catch((err) => active && setState({ data: null, loading: false, error: getErrorMessage(err) }));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
