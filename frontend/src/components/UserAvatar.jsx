import { Avatar } from '@mui/material';

// Deterministic colour per username so the same person always looks the same.
const COLORS = ['#6C4BF4', '#FF7A59', '#18B57A', '#2F80ED', '#E5397F', '#F2A93B', '#8E44AD'];

function colorFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export default function UserAvatar({ username = '?', src = '', size = 40, sx = {} }) {
  return (
    <Avatar
      src={src || undefined}
      alt={username}
      sx={{
        width: size,
        height: size,
        bgcolor: colorFor(username),
        fontSize: size * 0.42,
        fontWeight: 700,
        ...sx,
      }}
    >
      {username.charAt(0).toUpperCase()}
    </Avatar>
  );
}
