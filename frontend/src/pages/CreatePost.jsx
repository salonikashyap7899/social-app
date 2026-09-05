import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import Composer from '../components/Composer.jsx';

/** Dedicated compose screen, reached from the mobile bottom nav. */
export default function CreatePost() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1.5, px: 0.5 }}>
        New post
      </Typography>
      {/* Back to the feed once it is published, where the new post is already on top. */}
      <Composer onCreated={() => navigate('/')} />
      <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
        Add text, a photo, or both — one of them is enough.
      </Typography>
    </Box>
  );
}
