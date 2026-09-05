import { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { timeAgo } from '../utils/time.js';
import UserAvatar from './UserAvatar.jsx';

function CommentRow({ comment }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.25, mb: 1.25, alignItems: 'flex-start' }}>
      <UserAvatar username={comment.username} src={comment.avatar} size={30} />
      <Box
        sx={{
          bgcolor: 'rgba(255,255,255,0.05)',
          borderRadius: 3,
          px: 1.75,
          py: 1.1,
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {comment.username}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {timeAgo(comment.createdAt)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {comment.text}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Comment list + input.
 *
 * The feed ships only the newest two comments with each post, so the full list
 * is fetched lazily the first time someone opens the thread.
 */
export default function CommentSection({ postId, previewComments, totalCount, onAdded }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(previewComments || []);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Keep the preview in sync when the parent refreshes the feed.
  useEffect(() => {
    if (!expanded) setComments(previewComments || []);
  }, [previewComments, expanded]);

  const hidden = Math.max(0, totalCount - comments.length);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const { comments: all } = await api.getComments(postId);
      setComments(all);
      setExpanded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || sending) return;

    setSending(true);
    setError('');
    try {
      const { comment, commentsCount } = await api.addComment(postId, value);
      setComments((prev) => [...prev, comment]);
      setText('');
      onAdded?.(commentsCount); // updates the counter on the post header instantly
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      {hidden > 0 && !expanded && (
        <Button
          size="small"
          onClick={loadAll}
          disabled={loading}
          sx={{ mb: 1, px: 0, color: 'text.secondary' }}
        >
          {loading ? 'Loading…' : `View ${hidden} earlier comment${hidden > 1 ? 's' : ''}`}
        </Button>
      )}

      {comments.map((c) => (
        <CommentRow key={c._id || `${c.username}-${c.createdAt}`} comment={c} />
      ))}

      {comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          No comments yet — be the first.
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {user ? (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <UserAvatar username={user.username} src={user.avatar} size={30} />
          <TextField
            fullWidth
            size="small"
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            InputProps={{ sx: { borderRadius: 999 } }}
          />
          <IconButton type="submit" color="primary" disabled={!text.trim() || sending} aria-label="send comment">
            {sending ? <CircularProgress size={20} /> : <SendRoundedIcon />}
          </IconButton>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Log in to join the conversation.
        </Typography>
      )}
    </Box>
  );
}
