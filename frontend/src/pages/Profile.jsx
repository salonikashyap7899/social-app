import { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Skeleton } from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useNavigate } from 'react-router-dom';
import PostList from '../components/PostList.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import { usePosts } from '../hooks/usePosts.js';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { compactCount } from '../utils/time.js';
import { brand } from '../theme.js';

function Stat({ value, label, loading }) {
  return (
    <Box sx={{ textAlign: 'left' }}>
      {loading ? (
        <Skeleton width={44} height={30} sx={{ bgcolor: 'rgba(255,255,255,0.25)' }} />
      ) : (
        <Typography variant="h5" sx={{ lineHeight: 1.1 }}>
          {compactCount(value)}
        </Typography>
      )}
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
        {label}
      </Typography>
    </Box>
  );
}

/** The signed-in user's own posts, reusing the same paginated feed endpoint. */
export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const feed = usePosts({ author: user.id });

  // Totals come from the server so they stay right regardless of how many
  // pages of the profile feed have been scrolled into view.
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancelled = false;
    api
      .getStats(user.id)
      .then((s) => !cancelled && setStats(s))
      .catch(() => !cancelled && setStats({ posts: 0, likes: 0, comments: 0 }));
    return () => {
      cancelled = true;
    };
  }, [user.id, feed.posts.length]);

  return (
    <Box>
      <Card sx={{ mb: 2, p: 2.5, background: brand.gradient, border: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <UserAvatar
            username={user.username}
            src={user.avatar}
            size={72}
            sx={{ border: '3px solid rgba(255,255,255,0.9)' }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {user.username}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }} noWrap>
              {user.email}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 4, mt: 2.5 }}>
          <Stat value={stats?.posts ?? 0} label="Posts" loading={!stats} />
          <Stat value={stats?.likes ?? 0} label="Likes" loading={!stats} />
          <Stat value={stats?.comments ?? 0} label="Comments" loading={!stats} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 2.5 }}>
          <Button
            fullWidth
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate('/create')}
            sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: brand.pinkDark, '&:hover': { bgcolor: '#fff' } }}
          >
            New post
          </Button>
          <Button
            fullWidth
            startIcon={<LogoutRoundedIcon />}
            onClick={() => {
              logout();
              navigate('/login');
            }}
            sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.6)' }}
          >
            Log out
          </Button>
        </Box>
      </Card>

      <Typography variant="subtitle2" sx={{ mb: 1.5, px: 0.5, color: 'text.secondary' }}>
        YOUR POSTS
      </Typography>

      <PostList feed={feed} emptyTitle="No posts yet" emptyBody="Anything you share will show up here." />
    </Box>
  );
}
