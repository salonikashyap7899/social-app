import { Box, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { brand } from '../theme.js';

/**
 * The horizontal avatar strip at the top of the feed.
 *
 * These are the people posting most recently, derived from the feed already in
 * memory - no extra request. "You" comes first and opens the composer.
 */
export default function StoryRow({ posts = [] }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // De-duplicate authors, keeping feed order (newest first).
  const seen = new Set();
  const authors = [];
  for (const post of posts) {
    if (post.author === user?.id || seen.has(post.author)) continue;
    seen.add(post.author);
    authors.push({ id: post.author, username: post.authorUsername, avatar: post.authorAvatar });
    if (authors.length === 12) break;
  }

  if (!user && authors.length === 0) return null;

  const Item = ({ children, label, onClick }) => (
    <Box
      component={onClick ? 'button' : 'div'}
      onClick={onClick}
      sx={{
        border: 0,
        bgcolor: 'transparent',
        p: 0,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        flex: '0 0 auto',
        width: 68,
      }}
    >
      {children}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box
      className="no-scrollbar"
      sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, px: 0.5 }}
    >
      {user && (
        <Item label="You" onClick={() => navigate('/create')}>
          <Box sx={{ position: 'relative' }}>
            <UserAvatar username={user.username} src={user.avatar} size={54} />
            {/* The add badge doubles as the affordance to open the composer. */}
            <Box
              sx={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: brand.gradient,
                border: `2px solid ${brand.bg}`,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 13, color: '#fff' }} />
            </Box>
          </Box>
        </Item>
      )}

      {authors.map((a) => (
        <Item key={a.id} label={a.username}>
          <UserAvatar username={a.username} src={a.avatar} size={54} ring gap={brand.bg} />
        </Item>
      ))}
    </Box>
  );
}
