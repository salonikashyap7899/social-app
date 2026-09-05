import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Images arrive as base64 data URLs, so the default 100kb body limit is too small.
app.use(express.json({ limit: '5mb' }));

/*
 * CORS.
 *
 * `CLIENT_ORIGINS` is the explicit allowlist (comma-separated). On top of it we
 * always accept localhost during development and the hosting platforms this
 * project deploys to, so a Vercel preview URL - which gets a new subdomain on
 * every push - does not break the app until someone updates an env var.
 */
const configured = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, '')) // a trailing slash is the classic mistake
  .filter(Boolean);

const ALWAYS_ALLOWED = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https:\/\/[\w-]+\.vercel\.app$/,
  /^https:\/\/[\w-]+\.netlify\.app$/,
];

function isAllowed(origin) {
  if (configured.includes('*')) return true;
  if (configured.includes(origin)) return true;
  return ALWAYS_ALLOWED.some((re) => re.test(origin));
}

app.use(
  cors({
    origin(origin, cb) {
      // No Origin header = curl, same-origin, or server-to-server. Always fine.
      if (!origin) return cb(null, true);
      if (isAllowed(origin)) return cb(null, true);

      // Refuse by withholding the CORS header, NOT by erroring. Passing an Error
      // here would surface as a 500 with no CORS headers at all, which the
      // browser reports as an unreachable server rather than a blocked origin.
      console.warn(`CORS: refused origin ${origin} (not in CLIENT_ORIGINS)`);
      cb(null, false);
    },
  })
);

// Friendly root so hitting the Render URL directly explains what this service is.
app.get('/', (_req, res) =>
  res.json({
    name: 'Pulse API',
    docs: 'https://github.com/salonikashyap7899/social-app#api-reference',
    health: '/api/health',
  })
);

// Render pings this to keep the free instance awake and to check health.
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
