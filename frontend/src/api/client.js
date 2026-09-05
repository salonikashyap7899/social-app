// Single place that knows how to talk to the API: base URL, auth header,
// and turning non-2xx responses into thrown Errors with the server's message.

/**
 * Normalises VITE_API_URL.
 *
 * Pasting into a hosting dashboard's env-var field is easy to get wrong, and the
 * failure is baffling: a value like "https://api.example.comhttps://api.example.com"
 * produces a hostname that does not resolve, which surfaces as a generic network
 * error rather than "your config is wrong". So keep only the first origin, and
 * drop any trailing slash (which would otherwise yield "//api/posts").
 */
function normaliseBase(raw) {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return ''; // empty = same-origin, which is what local dev uses

  // Split before every "http://" / "https://" (tolerating a dropped colon) and
  // keep the first, so a value pasted more than once still works.
  const [first] = trimmed.split(/(?=https?:?\/\/)/);
  if (first !== trimmed) {
    console.warn(`VITE_API_URL looks duplicated; using "${first}". Fix it in your hosting dashboard.`);
  }
  return first.replace(/\/+$/, '');
}

const BASE = normaliseBase(import.meta.env.VITE_API_URL);

const TOKEN_KEY = 'pulse_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  // 204 and empty bodies are valid responses.
  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : {};

  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  getFeed: ({ cursor, limit = 10, author, likedBy } = {}) => {
    const qs = new URLSearchParams();
    if (cursor) qs.set('cursor', cursor);
    if (limit) qs.set('limit', String(limit));
    if (author) qs.set('author', author);
    if (likedBy) qs.set('likedBy', likedBy);
    return request(`/posts?${qs.toString()}`);
  },
  getStats: (author) => request(`/posts/stats${author ? `?author=${author}` : ''}`),
  createPost: (payload) => request('/posts', { method: 'POST', body: payload }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  toggleLike: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
  getLikes: (id) => request(`/posts/${id}/likes`),
  getComments: (id) => request(`/posts/${id}/comments`),
  addComment: (id, text) => request(`/posts/${id}/comments`, { method: 'POST', body: { text } }),
};
