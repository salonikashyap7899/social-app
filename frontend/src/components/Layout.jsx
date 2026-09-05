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
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAuth } from '../context/AuthContext.jsx';
import UserAvatar from './UserAvatar.jsx';

/** App shell: gradient top bar everywhere, plus a bottom nav on small screens. */
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useMediaQuery((t) => t.breakpoints.down('sm'));
  const [anchor, setAnchor] = useState(null);

  const handleLogout = () => {
    setAnchor(null);
    logout();
    navigate('/login');
  };

  const showBottomNav = isMobile && Boolean(user);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        sx={{ background: 'linear-gradient(90deg, #6C4BF4 0%, #8E74FF 100%)' }}
      >
        <Container maxWidth="sm" disableGutters>
          <Toolbar sx={{ gap: 1, px: 2 }}>
            <Box
              component={Link}
              to="/"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                }}
              >
                ⚡
              </Box>
              <Typography variant="h6" sx={{ letterSpacing: -0.3 }}>
                Pulse
              </Typography>
            </Box>

            {user ? (
              <>
                <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)} aria-label="account menu">
                  <UserAvatar username={user.username} src={user.avatar} size={32} />
                </IconButton>
                <Menu
                  anchorEl={anchor}
                  open={Boolean(anchor)}
                  onClose={() => setAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem disabled sx={{ opacity: '1 !important' }}>
                    <Box>
                      <Typography variant="subtitle2">@{user.username}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem component={Link} to="/profile" onClick={() => setAnchor(null)}>
                    <ListItemIcon>
                      <PersonRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    My posts
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    Log out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button component={Link} to="/login" color="inherit" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.5)' }}>
                Log in
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        maxWidth="sm"
        component="main"
        sx={{ flexGrow: 1, py: 2, px: { xs: 1.5, sm: 2 }, pb: showBottomNav ? 10 : 4 }}
      >
        {children}
      </Container>

      {showBottomNav && (
        <Paper
          elevation={8}
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10, borderRadius: '16px 16px 0 0' }}
        >
          <BottomNavigation
            showLabels
            value={pathname}
            onChange={(_e, value) => navigate(value)}
            sx={{ borderRadius: '16px 16px 0 0' }}
          >
            <BottomNavigationAction label="Feed" value="/" icon={<HomeRoundedIcon />} />
            <BottomNavigationAction label="Post" value="/create" icon={<AddCircleRoundedIcon />} />
            <BottomNavigationAction label="Profile" value="/profile" icon={<PersonRoundedIcon />} />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
