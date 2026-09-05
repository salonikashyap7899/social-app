import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Lets the dev frontend call the local API at /api without CORS juggling.
    proxy: { '/api': 'http://localhost:5000' },
  },
});
