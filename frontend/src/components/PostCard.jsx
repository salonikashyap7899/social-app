import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Box, Typography, IconButton, Menu, MenuItem, ListItemIcon, Snackbar } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { timeAgo, compactCount } from '../utils/time.js';
import UserAvatar from './UserAvatar.jsx';
import CommentSection from './CommentSection.jsx';
import { brand } from '../theme.js';

/** A single rounded stat pill (heart / comment) with its count. */
function StatPill({ icon, count, label, active, onClick, glass }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        border: 0,
        cursor: 'pointer',
        font: 'inherit',
        fontWeight: 700,
        fontSize: 13,
        px: 1.5,
        py: 0.85,
        borderRadius: 999,
        color: active ? brand.pink : '#fff',
        // On top of an image the pills need their own frosted backdrop.
        bgcolor: glass ? 'rgba(12,12,16,0.62)' : 'rgba(255,255,255,0.07)',
        backdropFilter: glass ? 'blur(10px)' : 'none',
        transition: 'background 140ms ease, color 140ms ease',
        '&:hover': { bgcolor: glass ? 'rgba(12,12,16,0.78)' : 'rgba(255,255,255,0.13)' },
        '& svg': { fontSize: 18 },
      }}
    >
      {icon}
      <span>{compactCount(count)}</span>
    </Box>
  );
}

/** "Aisha, Rahul and 4 others" — who liked this post. */
function likeSummary(names = [], total = 0) {
  if (total === 0) return '';
  const shown = names.slice(0, 2);
  const rest = total - shown.length;
  if (shown.length === 0) return `${compactCount(total)} likes`;
  if (rest <= 0) return `Liked by ${shown.join(' and ')}`;
  return `Liked by ${shown.join(', ')} and ${compactCount(rest)} other${rest > 1 ? 's' : ''}`;
}

function PostCard({ post, onChange, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [toast, setToast] = useState('');

  const isOwner = user && post.author === user.id;
  const hasImage = Boolean(post.image);

  /**
   * Optimistic like: flip the heart and the counter immediately, then reconcile
   * with the server's authoritative numbers (or roll back if it failed).
   */
  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const snapshot = { likedByMe: post.likedByMe, likesCount: post.likesCount, likePreview: post.likePreview };
    onChange({
      ...post,
      likedByMe: !post.likedByMe,
      likesCount: post.likesCount + (post.likedByMe ? -1 : 1),
      likePreview: post.likedByMe
        ? (post.likePreview || []).filter((n) => n !== user.username)
        : [user.username, ...(post.likePreview || [])].slice(0, 3),
    });

    try {
      const res = await api.toggleLike(post._id);
      onChange({ ...post, likedByMe: res.liked, likesCount: res.likesCount, likePreview: res.likePreview });
    } catch (err) {
      onChange({ ...post, ...snapshot });
      setToast(err.message);
    }
  };

  const handleDelete = async () => {
    setMenuAnchor(null);
    try {
      await api.deletePost(post._id);
      onDelete?.(post._id);
    } catch (err) {
      setToast(err.message);
    }
  };

  const pills = (glass) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <StatPill
        glass={glass}
        active={post.likedByMe}
        onClick={handleLike}
        label={post.likedByMe ? 'Unlike' : 'Like'}
        count={post.likesCount}
        icon={post.likedByMe ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
      />
      <StatPill
        glass={glass}
        active={showComments}
        onClick={() => setShowComments((v) => !v)}
        label="Comments"
        count={post.commentsCount}
        icon={<ChatBubbleOutlineRoundedIcon />}
      />
    </Box>
  );

  return (
    <>
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        {/* Author row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, pt: 2, pb: 1.5 }}>
          <UserAvatar username={post.authorUsername} src={post.authorAvatar} size={40} ring />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {post.authorUsername}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {timeAgo(post.createdAt)}
            </Typography>
          </Box>
          {isOwner && (
            <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="post options">
              <MoreHorizRoundedIcon />
            </IconButton>
          )}
        </Box>

        {post.text && (
          <Typography
            sx={{
              px: 2,
              pb: hasImage ? 1.5 : 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              // Text-only posts carry the card, so give them more presence.
              fontSize: hasImage ? 15 : 17,
              fontWeight: hasImage ? 400 : 500,
              lineHeight: 1.45,
            }}
          >
            {post.text}
          </Typography>
        )}

        {hasImage ? (
          <Box sx={{ position: 'relative', mx: 1.5, mb: 1.5, borderRadius: 4, overflow: 'hidden' }}>
            <Box
              component="img"
              src={post.image}
              alt=""
              loading="lazy"
              sx={{ width: '100%', maxHeight: 520, objectFit: 'cover', display: 'block' }}
            />
            {/* Gradient scrim keeps the pills readable over any photo. */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 45%)',
                pointerEvents: 'none',
              }}
            />
            <Box sx={{ position: 'absolute', left: 12, bottom: 12 }}>{pills(true)}</Box>
          </Box>
        ) : (
          <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>{pills(false)}</Box>
        )}

        {post.likesCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pb: 1.75 }}>
            {likeSummary(post.likePreview, post.likesCount)}
          </Typography>
        )}

        {showComments && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.75 }}>
            <CommentSection
              postId={post._id}
              previewComments={post.comments}
              totalCount={post.commentsCount}
              onAdded={(commentsCount) => onChange({ ...post, commentsCount })}
            />
          </Box>
        )}
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        slotProps={{ paper: { sx: { bgcolor: brand.raised, borderRadius: 3 } } }}
      >
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteOutlineRoundedIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete post
        </MenuItem>
      </Menu>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </>
  );
}

// The feed re-renders on every scroll page; only redraw cards that actually changed.
export default memo(PostCard);
