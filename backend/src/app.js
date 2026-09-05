import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Images arrive as base64 data URLs, so the default 100kb body limit is too small.
app.use(express.json({ limit: '5mb' }));

// Allow the deployed frontend (and localhost during development).
const allowed = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // No origin = curl / same-origin / server-to-server.
      if (!origin || allowed.includes('*') || allowed.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);

// Render pings this to keep the free instance awake and to check health.
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
