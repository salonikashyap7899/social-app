import { Box, Typography, Card, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import Composer from '../components/Composer.jsx';
import PostList from '../components/PostList.jsx';
import { usePosts } from '../hooks/usePosts.js';
import { useAuth } from '../context/AuthContext.jsx';

/** Public feed: every post from every user, newest first. */
export default function Feed() {
  const { user } = useAuth();
  const feed = usePosts();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1.5, px: 0.5 }}>
        Community feed
      </Typography>

      {user ? (
        <Composer onCreated={feed.prepend} />
      ) : (
        <Card sx={{ mb: 2, p: 2.5, textAlign: 'center' }}>
          <Typography variant="subtitle1" gutterBottom>
            Join the conversation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create an account to post, like and comment.
          </Typography>
          <Button component={Link} to="/signup" variant="contained">
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
