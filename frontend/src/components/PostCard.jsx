import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  Snackbar,
} from '@mui/material';
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

/** "Aisha, Rahul and 4 others" — who liked this post. */
function likeSummary(names = [], total = 0) {
  if (total === 0) return '';
  const shown = names.slice(0, 2);
  const rest = total - shown.length;
  if (shown.length === 0) return `${compactCount(total)} likes`;
  if (rest <= 0) return shown.join(' and ');
  return `${shown.join(', ')} and ${compactCount(rest)} other${rest > 1 ? 's' : ''}`;
}

function PostCard({ post, onChange, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [toast, setToast] = useState('');

  const isOwner = user && post.author === user.id;

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

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <UserAvatar username={post.authorUsername} src={post.authorAvatar} />
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
              variant="body1"
              sx={{ mt: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 15 }}
            >
              {post.text}
            </Typography>
          )}
        </CardContent>

        {post.image && (
          <Box
            component="img"
            src={post.image}
            alt=""
            loading="lazy"
            sx={{ width: '100%', maxHeight: 520, objectFit: 'cover', display: 'block' }}
          />
        )}

        <Box sx={{ px: 2, pt: 1.25, display: 'flex', gap: 2, minHeight: 24 }}>
          {post.likesCount > 0 && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
              ❤️ {likeSummary(post.likePreview, post.likesCount)}
            </Typography>
          )}
          {post.commentsCount > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ cursor: 'pointer', ml: 'auto', whiteSpace: 'nowrap' }}
              onClick={() => setShowComments(true)}
            >
              {compactCount(post.commentsCount)} comment{post.commentsCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Divider sx={{ mt: 1.25 }} />

        <Box sx={{ display: 'flex' }}>
          <Button
            fullWidth
            onClick={handleLike}
            startIcon={post.likedByMe ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
            sx={{ py: 1.25, borderRadius: 0, color: post.likedByMe ? 'error.main' : 'text.secondary' }}
          >
            Like
          </Button>
          <Divider orientation="vertical" flexItem />
          <Button
            fullWidth
            onClick={() => setShowComments((v) => !v)}
            startIcon={<ChatBubbleOutlineRoundedIcon />}
            sx={{ py: 1.25, borderRadius: 0, color: showComments ? 'primary.main' : 'text.secondary' }}
          >
            Comment
          </Button>
        </Box>

        {showComments && (
          <>
            <Divider />
            <Box sx={{ pt: 1.5 }}>
              <CommentSection
                postId={post._id}
                previewComments={post.comments}
                totalCount={post.commentsCount}
                onAdded={(commentsCount) => onChange({ ...post, commentsCount })}
              />
            </Box>
          </>
        )}
      </Card>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
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
