import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import { useAuth } from '../context/AuthContext.jsx';
import { brand } from '../theme.js';

/**
 * One component backs both /login and /signup — the only differences are the
 * username field, the copy, and which auth call fires.
 */
export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    if (isSignup && form.username.trim().length < 3) return 'Username must be at least 3 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Enter a valid email address';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    setError('');
    try {
      const payload = { email: form.email.trim(), password: form.password };
      if (isSignup) payload.username = form.username.trim();
      await (isSignup ? signup(payload) : login(payload));
      // Send the user back to whatever page bounced them here.
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 440, mx: 'auto', pt: { xs: 2, sm: 5 } }}>
      {/* Onboarding-style headline: one word picked out in the accent colour. */}
      <Typography variant="h4" sx={{ mb: 1, lineHeight: 1.15 }}>
        The{' '}
        <Box component="span" sx={{ color: brand.pink }}>
          Social
        </Box>{' '}
        Space
        <br />
        for Everyone
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isSignup
          ? 'Share your story and connect with the world.'
          : 'Welcome back — pick up where you left off.'}
      </Typography>

      <Card sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <TextField
              fullWidth
              label="Username"
              value={form.username}
              onChange={update('username')}
              autoComplete="username"
              sx={{ mb: 2 }}
            />
          )}
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={update('password')}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            size="large"
            variant="contained"
            disabled={busy}
            startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ py: 1.4 }}
          >
            {isSignup ? 'Create account' : 'Log in'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5, textAlign: 'center' }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            to={isSignup ? '/login' : '/signup'}
            style={{ color: brand.pink, fontWeight: 700, textDecoration: 'none' }}
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </Link>
        </Typography>
      </Card>
    </Box>
  );
}
