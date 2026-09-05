import { Box, Card, Typography, Divider } from '@mui/material';
import PostList from '../components/PostList.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import { usePosts } from '../hooks/usePosts.js';
import { useAuth } from '../context/AuthContext.jsx';

/** The signed-in user's own posts, reusing the same paginated feed endpoint. */
export default function Profile() {
  const { user } = useAuth();
  const feed = usePosts({ author: user.id });

  return (
    <Box>
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        <Box sx={{ height: 84, background: 'linear-gradient(90deg, #6C4BF4 0%, #8E74FF 100%)' }} />
        <Box sx={{ px: 2, pb: 2, mt: -4.5 }}>
          <UserAvatar
            username={user.username}
            src={user.avatar}
            size={72}
            sx={{ border: '3px solid #fff' }}
          />
          <Typography variant="h6" sx={{ mt: 1 }}>
            {user.username}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" color="text.secondary">
            Member since{' '}
            {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
      </Card>

      <Typography variant="subtitle2" sx={{ mb: 1, px: 0.5, color: 'text.secondary' }}>
        YOUR POSTS
      </Typography>

      <PostList
        feed={feed}
        emptyTitle="No posts yet"
        emptyBody="Anything you share will show up here."
      />
    </Box>
  );
}
