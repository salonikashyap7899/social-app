import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Button,
  Badge,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { useAuth } from '../context/AuthContext.jsx';
import UserAvatar from './UserAvatar.jsx';
import { brand } from '../theme.js';

const NAV = [
  { label: 'Home', value: '/', icon: <HomeRoundedIcon /> },
  { label: 'Create', value: '/create', icon: <AddRoundedIcon /> },
  { label: 'Likes', value: '/liked', icon: <FavoriteRoundedIcon /> },
  { label: 'Profile', value: '/profile', icon: <PersonRoundedIcon /> },
];

/**
 * Floating navigation bar. The active item expands into a pink pill that shows
 * its label, while the others stay icon-only.
 */
function FloatingNav({ pathname, onNavigate }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 14, sm: 20 },
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 0.75,
          borderRadius: 999,
          bgcolor: 'rgba(28,28,36,0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
        }}
      >
        {NAV.map((item) => {
          const active = pathname === item.value;
          return (
            <Box
              key={item.value}
              component="button"
              onClick={() => onNavigate(item.value)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                border: 0,
                cursor: 'pointer',
                borderRadius: 999,
                px: active ? 2 : 1.5,
                py: 1.25,
                font: 'inherit',
                fontWeight: 700,
                fontSize: 14,
                color: active ? '#fff' : 'text.secondary',
                background: active ? brand.gradient : 'transparent',
                transition: 'padding 160ms ease, background 160ms ease',
                '&:hover': { color: active ? '#fff' : '#fff' },
                '& svg': { fontSize: 22 },
              }}
            >
              {item.icon}
              {active && <span>{item.label}</span>}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/** App shell: dark header, centred content column, floating bottom nav. */
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [anchor, setAnchor] = useState(null);

  const handleLogout = () => {
    setAnchor(null);
    logout();
    navigate('/login');
  };

  const titles = { '/': 'Home', '/create': 'Create', '/profile': 'Profile', '/liked': 'Liked' };
  const title = titles[pathname] || 'Pulse';

  // The nav is for signed-in users; visitors get a Log in button instead.
  const showNav = Boolean(user);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" sx={{ bgcolor: 'rgba(11,11,15,0.85)', backdropFilter: 'blur(14px)' }}>
        <Container maxWidth="sm" disableGutters>
          <Toolbar sx={{ gap: 1, px: 2, minHeight: { xs: 62, sm: 70 } }}>
            <Box
              component={Link}
              to="/"
              sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'inherit', textDecoration: 'none' }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2.5,
                  background: brand.gradient,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                }}
              >
                ⚡
              </Box>
              <Typography variant="h6">{title}</Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {user ? (
              <>
                <IconButton
                  sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2.5 }}
                  aria-label="notifications"
                  onClick={() => navigate('/liked')}
                >
                  <Badge color="primary" variant="dot">
                    <NotificationsNoneRoundedIcon />
                  </Badge>
                </IconButton>
                <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="account menu" sx={{ p: 0.5 }}>
                  <UserAvatar username={user.username} src={user.avatar} size={34} ring gap={brand.bg} />
                </IconButton>
                <Menu
                  anchorEl={anchor}
                  open={Boolean(anchor)}
                  onClose={() => setAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{ paper: { sx: { bgcolor: brand.raised, borderRadius: 3, minWidth: 210 } } }}
                >
                  <MenuItem disabled sx={{ opacity: '1 !important' }}>
                    <Box>
                      <Typography variant="subtitle2">{user.username}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem component={Link} to="/profile" onClick={() => setAnchor(null)}>
                    <ListItemIcon>
                      <PersonRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    My profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                      <LogoutRoundedIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    Log out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button component={Link} to="/login" variant="contained">
                Log in
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        maxWidth="sm"
        component="main"
        sx={{ flexGrow: 1, py: 2, px: { xs: 1.5, sm: 2 }, pb: showNav ? 13 : 5 }}
      >
        {children}
      </Container>

      {showNav && <FloatingNav pathname={pathname} onNavigate={navigate} />}
    </Box>
  );
}
