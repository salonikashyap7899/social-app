// Starts the API on an in-memory MongoDB and seeds a few users and posts.
// Handy for trying the UI locally without a MongoDB Atlas account:
//   cd backend && node test/devserver.mjs
// then run the frontend with `npm run dev` (Vite proxies /api to port 5000).
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../src/db.js';

const mem = await MongoMemoryServer.create();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret';
process.env.CLIENT_ORIGINS = '*';

const app = (await import('../src/app.js')).default;
await connectDB(mem.getUri('socialapp_dev'));

const PORT = 5000;
app.listen(PORT, () => console.log(`Dev API (in-memory DB) on http://localhost:${PORT}`));

const BASE = `http://localhost:${PORT}/api`;
const call = (path, { method = 'GET', body, token } = {}) =>
  fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => ({ status: r.status, data: await r.json() }));

const SEED = [
  { username: 'aisha', email: 'aisha@demo.com', text: 'First day using Pulse — the feed looks great! 🎉' },
  { username: 'rahul', email: 'rahul@demo.com', text: 'Shipped the pagination today. Cursor-based, no skip().' },
  { username: 'meera', email: 'meera@demo.com', text: 'Anyone else up early grinding? ☕' },
];

const accounts = [];
for (const s of SEED) {
  const res = await call('/auth/signup', {
    method: 'POST',
    body: { username: s.username, email: s.email, password: 'demo1234' },
  });
  const token = res.data.token;
  accounts.push({ ...s, token });
  await call('/posts', { method: 'POST', body: { text: s.text }, token });
}

// A little cross-user like and comment activity so the feed is not empty.
const { data: feed } = await call('/posts');
for (const post of feed.posts) {
  for (const acc of accounts) {
    if (acc.username !== post.authorUsername) {
      await call(`/posts/${post._id}/like`, { method: 'POST', token: acc.token });
    }
  }
}
await call(`/posts/${feed.posts[0]._id}/comments`, {
  method: 'POST',
  body: { text: 'Welcome aboard!' },
  token: accounts[1].token,
});

console.log(`Seeded ${SEED.length} demo accounts (password: demo1234): ${SEED.map((s) => s.email).join(', ')}`);
