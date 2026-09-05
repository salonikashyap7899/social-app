# Pulse — Mini Social Post Application

A small social feed where people sign up, post text and/or images, and like and comment on
each other's posts. Built for the **3W Full Stack Internship Assignment (Task 1)**, with the
UI taking its cues from the TaskPlanet app's Social page: a purple gradient header, rounded
white cards, a like/comment action bar under every post, and a bottom navigation bar on mobile.

| Layer | Tech |
| --- | --- |
| Frontend | React 18 + Vite, **Material UI (MUI v5)**, React Router |
| Backend | Node.js + Express (ESM) |
| Database | MongoDB (Mongoose) — **exactly two collections: `users` and `posts`** |
| Auth | JWT (7-day tokens) + bcrypt password hashing |

> No TailwindCSS is used anywhere in this project.

## Live links

| What | URL |
| --- | --- |
| Frontend (Vercel/Netlify) | _fill in after deploying_ |
| Backend (Render) | _fill in after deploying_ |
| Repository | <https://github.com/salonikashyap7899/social-app> |

## Repository layout

```
social-app/
├── backend/                 # Express API
│   ├── src/
│   │   ├── models/          # User.js, Post.js  (the only two collections)
│   │   ├── routes/          # auth.js, posts.js
│   │   ├── middleware/      # auth.js (JWT), errorHandler.js
│   │   ├── utils/token.js
│   │   ├── app.js           # express app (no listen — importable by tests)
│   │   ├── db.js            # mongoose connection
│   │   └── server.js        # entry point
│   └── test/api.test.mjs    # 45-assertion end-to-end suite (in-memory MongoDB)
└── frontend/                # React client
    └── src/
        ├── api/client.js    # single fetch wrapper: base URL, JWT header, errors
        ├── context/         # AuthContext — session state for the whole tree
        ├── hooks/usePosts.js# cursor pagination state machine
        ├── components/      # Layout, Composer, PostCard, CommentSection, PostList…
        └── pages/           # Feed, Profile, CreatePost, AuthForm
```

## Features

**Accounts** — email + password signup and login. Passwords are bcrypt-hashed (never stored
or returned in plain text), sessions are JWTs kept in `localStorage`, and the session is
restored on refresh via `GET /api/auth/me`.

**Create post** — text, an image, or both. Neither field is mandatory on its own; the API
rejects a post only when *both* are empty. Images are downscaled to 1280px and re-encoded as
JPEG in a canvas on the client before upload, so they stay small enough to live inside the
post document — which is what keeps the whole app inside two collections.

**Public feed** — every post from every user, newest first, showing the author's name and
avatar, a relative timestamp, the content, and live like/comment counts.

**Likes and comments** — any signed-in user can like or comment on any post. The **username of
every liker and commenter is stored** on the post (`likes[].username`, `comments[].username`)
and surfaced in the UI as "Aisha, Rahul and 4 others". Likes toggle: liking twice removes it.

**Instant UI updates** — a like flips the heart and the counter immediately (optimistic
update) and rolls back if the request fails. A new comment is appended to the thread and the
header count bumps as soon as the server confirms. A new post is prepended to the feed
without a refetch.

## Notable implementation details

**Cursor pagination, not `skip`.** The feed uses keyset pagination on `(createdAt, _id)`. Each
response returns an opaque base64 `nextCursor`; the next request asks for rows strictly older
than it. Page 50 costs the same as page 1 — unlike `.skip(n)`, which makes the database walk
and discard `n` documents every time. It also can't duplicate or drop rows when new posts
arrive mid-scroll. The client drives it with an `IntersectionObserver` sentinel (infinite
scroll), not a scroll listener.

**The feed never ships data it doesn't render.** An aggregation projection computes
`likedByMe` server-side with `$in`, slices `likePreview` to 3 names and `comments` to the
newest 2, and leaves the full arrays on the server. Opening a comment thread lazily fetches
the rest. A post with 5,000 likes costs the same to list as one with none.

**Denormalised counters and author details.** `likesCount` / `commentsCount` are kept in sync
by the same atomic update that pushes the like or comment, so the feed never counts arrays at
read time, and the author's username/avatar are copied onto the post so a feed page needs
zero joins.

**Race-safe likes.** Toggling is two conditional `findOneAndUpdate` calls
(`{ 'likes.user': { $ne: userId } }` then the `$pull` fallback). Concurrent double-clicks
can't produce a duplicate like or drift the counter away from the array.

**Reusable components.** `PostList` + the `usePosts` hook back both the public feed and the
profile page; `AuthForm` backs both `/login` and `/signup`.

Also included: rate limiting on the auth routes, a compound index on `(createdAt, _id)`,
centralised error handling that turns Mongoose validation/duplicate-key errors into clean
JSON messages, an origin allowlist for CORS, skeleton loaders, empty states, and full
responsiveness (bottom nav under `sm`, app bar menu above it).

## Running locally

Requires Node 18+ and a MongoDB connection string (MongoDB Atlas or a local `mongod`).

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env          # then fill in MONGO_URI and JWT_SECRET
npm run dev                   # http://localhost:5000

# 2. Frontend (second terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

In development the frontend leaves `VITE_API_URL` empty and Vite proxies `/api` to
`localhost:5000`, so there is no CORS setup to do locally.

**No MongoDB handy?** `cd backend && npm run dev:demo` starts the same API against an
in-memory MongoDB and seeds three demo accounts (`aisha@demo.com` / `rahul@demo.com` /
`meera@demo.com`, password `demo1234`) with posts, likes and a comment. Data is discarded
when the process exits — it is for trying the UI, not for the graded deployment.

### Tests

```bash
cd backend
npm test
```

Spins up an in-memory MongoDB and exercises the whole API — signup/login, validation,
text-only and image-only posts, like toggling, comment storage, feed projection, cursor
pagination across pages, ownership checks on delete, and an assertion that the database ends
up with exactly two collections. 45 assertions, no external database needed.

## Environment variables

**backend/.env**

| Name | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `PORT` | Defaults to `5000`; Render sets this for you |
| `CLIENT_ORIGINS` | Comma-separated allowed origins, e.g. your Vercel URL |

**frontend/.env**

| Name | Purpose |
| --- | --- |
| `VITE_API_URL` | Deployed backend base URL. Leave empty locally to use the Vite proxy. |

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step instructions covering MongoDB Atlas,
Render (backend) and Vercel/Netlify (frontend).

## API reference

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | — | Create an account, returns `{ token, user }` |
| `POST` | `/api/auth/login` | — | Log in, returns `{ token, user }` |
| `GET` | `/api/auth/me` | ✅ | Current user (restores a session) |
| `GET` | `/api/posts` | optional | Feed. `?cursor=&limit=&author=` |
| `POST` | `/api/posts` | ✅ | Create a post (`text` and/or `image`) |
| `DELETE` | `/api/posts/:id` | ✅ | Delete your own post |
| `POST` | `/api/posts/:id/like` | ✅ | Toggle like, returns the new count |
| `GET` | `/api/posts/:id/likes` | — | Everyone who liked, with usernames |
| `POST` | `/api/posts/:id/comments` | ✅ | Add a comment |
| `GET` | `/api/posts/:id/comments` | — | All comments on a post |
| `GET` | `/api/health` | — | Health check |

Authenticated requests send `Authorization: Bearer <token>`.

## Data model

Two collections, as required.

**`users`** — `username` (unique), `email` (unique), `password` (bcrypt hash, `select: false`),
`avatar`, timestamps.

**`posts`** — `author` + denormalised `authorUsername` / `authorAvatar`, `text`, `image`,
`likes[{ user, username, createdAt }]`, `comments[{ user, username, avatar, text, createdAt }]`,
`likesCount`, `commentsCount`, timestamps. Likes and comments are embedded sub-documents
rather than collections of their own.
