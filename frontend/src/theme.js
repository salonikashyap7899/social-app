import { createTheme } from '@mui/material/styles';

// Brand tokens live here so components never hard-code a colour.
export const brand = {
  pink: '#FF2E74',
  pinkLight: '#FF6FA3',
  pinkDark: '#E01A5E',
  gradient: 'linear-gradient(135deg, #FF2E74 0%, #FF6FA3 100%)',
  ring: 'linear-gradient(135deg, #FF2E74 0%, #FF9A5A 100%)', // story ring
  bg: '#0B0B0F',
  card: '#16161C',
  raised: '#20202A',
};

/*
 * Dark, media-forward theme: near-black canvas, one hot-pink accent, heavily
 * rounded surfaces and pill-shaped controls.
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: brand.pink, light: brand.pinkLight, dark: brand.pinkDark, contrastText: '#FFFFFF' },
    secondary: { main: '#FF9A5A' },
    error: { main: '#FF4D6A' },
    success: { main: '#2ED47A' },
    background: { default: brand.bg, paper: brand.card },
    text: { primary: '#FFFFFF', secondary: '#9A9AA8' },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Segoe UI", system-ui, sans-serif',
    h4: { fontWeight: 800, letterSpacing: -0.8 },
    h5: { fontWeight: 800, letterSpacing: -0.5 },
    h6: { fontWeight: 700, letterSpacing: -0.3 },
    subtitle2: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 24,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 18 },
        // The accent gradient is the app's primary call to action.
        containedPrimary: {
          background: brand.gradient,
          '&:hover': { background: brand.gradient, filter: 'brightness(1.08)' },
          '&.Mui-disabled': { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.04)',
          '& fieldset': { borderColor: 'rgba(255,255,255,0.10)' },
          '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.20)' },
        },
      },
    },
    MuiAppBar: { defaultProps: { elevation: 0 } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

export default theme;
