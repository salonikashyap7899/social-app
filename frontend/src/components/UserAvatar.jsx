import { Avatar, Box } from '@mui/material';
import { brand } from '../theme.js';

// Deterministic colour per username so the same person always looks the same.
const COLORS = ['#FF2E74', '#FF9A5A', '#7B61FF', '#2ED47A', '#3AA0FF', '#FFC94D', '#FF6FA3'];

function colorFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

/**
 * Avatar with an optional gradient ring (the story-row treatment).
 *
 * `ring` draws the gradient border and `size` is the inner avatar diameter.
 * `gap` is the colour of the thin gap between ring and avatar - it has to match
 * whatever surface the avatar sits on, otherwise the gap reads as a dark notch.
 * Cards are the common case, so that is the default.
 */
export default function UserAvatar({
  username = '?',
  src = '',
  size = 40,
  ring = false,
  gap = brand.card,
  sx = {},
}) {
  const avatar = (
    <Avatar
      src={src || undefined}
      alt={username}
      sx={{
        width: size,
        height: size,
        bgcolor: colorFor(username),
        fontSize: size * 0.4,
        fontWeight: 800,
        color: '#fff',
        ...sx,
      }}
    >
      {username.charAt(0).toUpperCase()}
    </Avatar>
  );

  if (!ring) return avatar;

  return (
    <Box
      sx={{
        p: '2.5px',
        borderRadius: '50%',
        background: brand.ring,
        display: 'inline-flex',
        lineHeight: 0,
        // Inside a flex row the wrapper would otherwise stretch to the row's
        // height, and the ring would show as a crescent below the avatar.
        alignSelf: 'center',
        flex: '0 0 auto',
      }}
    >
      {/* Gap between ring and avatar; must match the surface behind it. */}
      <Box sx={{ p: '2px', borderRadius: '50%', bgcolor: gap, display: 'inline-flex' }}>{avatar}</Box>
    </Box>
  );
}
