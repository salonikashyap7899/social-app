import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';

/**
 * Cursor-paginated post list.
 *
 * The backend hands back an opaque `nextCursor` instead of a page number, so
 * loading more never re-sends rows the client already has, even when new posts
 * land at the top of the feed while the user is scrolling.
 */
export function usePosts({ author, likedBy } = {}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true); // first page
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const cursorRef = useRef(null);
  // Guards against two in-flight page requests (fast scroll + button click).
  const inFlight = useRef(false);

  const load = useCallback(
    async ({ reset = false } = {}) => {
      if (inFlight.current) return;
      inFlight.current = true;

      if (reset) {
        cursorRef.current = null;
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      try {
        const data = await api.getFeed({ cursor: reset ? null : cursorRef.current, author, likedBy });
        cursorRef.current = data.nextCursor;
        setHasMore(data.hasMore);
        setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
      } catch (err) {
        setError(err.message);
      } finally {
        inFlight.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [author, likedBy]
  );

  useEffect(() => {
    load({ reset: true });
  }, [load]);

  // `hasMore`/`loadingMore` live in a ref as well so `loadMore` keeps a stable
  // identity - otherwise PostList would tear down its IntersectionObserver, and
  // every memoised PostCard would re-render, on every state change.
  const stateRef = useRef({ hasMore, loadingMore });
  stateRef.current = { hasMore, loadingMore };

  const loadMore = useCallback(() => {
    const { hasMore: more, loadingMore: busy } = stateRef.current;
    if (more && !busy) load();
  }, [load]);

  const refresh = useCallback(() => load({ reset: true }), [load]);
  const prepend = useCallback((post) => setPosts((prev) => [post, ...prev]), []);
  const replace = useCallback(
    (post) => setPosts((prev) => prev.map((p) => (p._id === post._id ? post : p))),
    []
  );
  const remove = useCallback((id) => setPosts((prev) => prev.filter((p) => p._id !== id)), []);

  return useMemo(
    () => ({ posts, loading, loadingMore, hasMore, error, loadMore, refresh, prepend, replace, remove }),
    [posts, loading, loadingMore, hasMore, error, loadMore, refresh, prepend, replace, remove]
  );
}
