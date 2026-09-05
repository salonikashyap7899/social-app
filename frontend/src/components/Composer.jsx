import { useRef, useState } from 'react';
import { Card, Box, TextField, Button, IconButton, Typography, Alert, CircularProgress } from '@mui/material';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fileToCompressedDataUrl } from '../utils/image.js';
import UserAvatar from './UserAvatar.jsx';

const MAX_TEXT = 1000;

/**
 * Create-post box. Either the text or the image is enough to publish; the
 * button stays disabled until at least one of them has content.
 */
export default function Composer({ onCreated }) {
  const { user } = useAuth();
  const fileInput = useRef(null);
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canPost = Boolean(text.trim() || image) && !busy;

  const handlePick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allows re-picking the same file
    if (!file) return;
    setError('');
    try {
      setImage(await fileToCompressedDataUrl(file));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canPost) return;
    setBusy(true);
    setError('');
    try {
      const { post } = await api.createPost({ text: text.trim(), image });
      setText('');
      setImage('');
      onCreated?.(post);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ mb: 2, p: 2 }} component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <UserAvatar username={user?.username} src={user?.avatar} size={40} ring />
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={8}
          variant="standard"
          placeholder={`What's on your mind, ${user?.username || 'there'}?`}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
          InputProps={{ disableUnderline: true, sx: { fontSize: 16, mt: 0.75 } }}
        />
      </Box>

      {image && (
        <Box sx={{ position: 'relative', mt: 1.5, borderRadius: 4, overflow: 'hidden' }}>
          <Box
            component="img"
            src={image}
            alt="Selected preview"
            sx={{ width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block' }}
          />
          <IconButton
            size="small"
            onClick={() => setImage('')}
            aria-label="remove image"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: 'rgba(12,12,16,0.7)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(12,12,16,0.85)' },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
        <Button
          startIcon={<ImageRoundedIcon />}
          onClick={() => fileInput.current?.click()}
          sx={{ color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.06)' }}
        >
          Photo
        </Button>
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={handlePick} />

        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', mr: 1 }}>
          {text.length}/{MAX_TEXT}
        </Typography>
        <Button
          type="submit"
          variant="contained"
          disabled={!canPost}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Post
        </Button>
      </Box>
    </Card>
  );
}
