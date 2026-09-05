import { Box, Typography } from '@mui/material';
import PostList from '../components/PostList.jsx';
import { usePosts } from '../hooks/usePosts.js';
import { useAuth } from '../context/AuthContext.jsx';

/** Everything the signed-in user has liked, newest first. */
export default function Liked() {
  const { user } = useAuth();
  const feed = usePosts({ likedBy: user.id });

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5, px: 0.5, color: 'text.secondary' }}>
        POSTS YOU LIKED
      </Typography>
      <PostList
        feed={feed}
        emptyTitle="No likes yet"
        emptyBody="Tap the heart on a post and it will be saved here."
      />
    </Box>
  );
}
