import { createTheme } from '@mui/material/styles';

// Purple/indigo brand accent on a soft grey canvas, echoing the TaskPlanet
// social page: rounded cards, generous spacing, one strong accent colour.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6C4BF4', dark: '#5334E0', light: '#8E74FF' },
    secondary: { main: '#FF7A59' },
    success: { main: '#18B57A' },
    background: { default: '#F4F5FA', paper: '#FFFFFF' },
    text: { primary: '#171A2B', secondary: '#6B7189' },
    divider: 'rgba(23, 26, 43, 0.08)',
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(23, 26, 43, 0.06)',
          boxShadow: '0 2px 10px rgba(23, 26, 43, 0.04)',
        },
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiAppBar: { defaultProps: { elevation: 0 } },
  },
});

export default theme;
