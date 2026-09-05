import { useEffect, useRef } from 'react';
import { Box, Typography, Alert, Button, CircularProgress } from '@mui/material';
import PostCard from './PostCard.jsx';
import PostSkeleton from './PostSkeleton.jsx';

/**
 * Renders a paginated post list with infinite scroll.
 *
 * An IntersectionObserver on a sentinel below the last card asks for the next
 * page, so there is no scroll listener firing on every frame.
 */
export default function PostList({ feed, emptyTitle, emptyBody }) {
  const { posts, loading, loadingMore, hasMore, error, loadMore, replace, remove } = feed;
  const sentinel = useRef(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: '400px' } // start fetching before the user hits the bottom
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (loading) {
    return (
      <>
        <PostSkeleton />
        <PostSkeleton />
      </>
    );
  }

  if (error && posts.length === 0) {
    return (
      <Alert severity="error" action={<Button onClick={feed.refresh}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  if (posts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 7, px: 3 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            mx: 'auto',
            mb: 2,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontSize: 32,
            bgcolor: 'rgba(255,255,255,0.05)',
          }}
        >
          🪶
        </Box>
        <Typography variant="h6" gutterBottom>
          {emptyTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {emptyBody}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onChange={replace} onDelete={remove} />
      ))}

      <Box ref={sentinel} sx={{ display: 'grid', placeItems: 'center', py: 2, minHeight: 8 }}>
        {loadingMore && <CircularProgress size={24} />}
        {!hasMore && posts.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            You are all caught up ✨
          </Typography>
        )}
      </Box>

      {error && posts.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </>
  );
}
