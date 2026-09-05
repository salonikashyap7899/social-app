import { Box, Typography, Card, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import Composer from '../components/Composer.jsx';
import PostList from '../components/PostList.jsx';
import StoryRow from '../components/StoryRow.jsx';
import { usePosts } from '../hooks/usePosts.js';
import { useAuth } from '../context/AuthContext.jsx';
import { brand } from '../theme.js';

/** Public feed: every post from every user, newest first. */
export default function Feed() {
  const { user } = useAuth();
  const feed = usePosts();

  return (
    <Box>
      <StoryRow posts={feed.posts} />

      {user ? (
        <Composer onCreated={feed.prepend} />
      ) : (
        <Card sx={{ mb: 2, p: 3, textAlign: 'center', background: brand.gradient, border: 0 }}>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            The Social Space
          </Typography>
          <Typography variant="body2" sx={{ mb: 2.5, color: 'rgba(255,255,255,0.85)' }}>
            Share your story and connect with the world.
          </Typography>
          <Button
            component={Link}
            to="/signup"
            variant="contained"
            sx={{ bgcolor: '#fff', color: brand.pinkDark, background: '#fff', '&:hover': { background: '#fff' } }}
          >
            Create account
          </Button>
        </Card>
      )}

      <PostList
        feed={feed}
        emptyTitle="Nothing here yet"
        emptyBody="Be the first to share something with the community."
      />
    </Box>
  );
}
