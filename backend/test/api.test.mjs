// End-to-end smoke test of the API against an in-memory MongoDB.
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const mem = await MongoMemoryServer.create();
process.env.JWT_SECRET = 'test-secret';
// A realistic allowlist rather than '*', so the CORS tests below actually
// exercise the accept/refuse logic.
process.env.CLIENT_ORIGINS = 'https://my-app.example.com';

const { connectDB } = await import('../src/db.js');
const app = (await import('../src/app.js')).default;

await connectDB(mem.getUri('socialapp_test'));
const server = app.listen(5099);
const BASE = 'http://localhost:5099/api';

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : {} };
}

console.log('\n--- auth ---');
const alice = await call('/auth/signup', { method: 'POST', body: { username: 'alice', email: 'alice@test.com', password: 'secret123' } });
check('signup returns 201 + token', alice.status === 201 && !!alice.data.token, JSON.stringify(alice.data));
check('signup never leaks password', alice.data.user && alice.data.user.password === undefined);

const dupe = await call('/auth/signup', { method: 'POST', body: { username: 'alice', email: 'other@test.com', password: 'secret123' } });
check('duplicate username -> 409', dupe.status === 409, JSON.stringify(dupe.data));

const bob = await call('/auth/signup', { method: 'POST', body: { username: 'bob', email: 'bob@test.com', password: 'secret123' } });
check('second signup ok', bob.status === 201);

const badLogin = await call('/auth/login', { method: 'POST', body: { email: 'alice@test.com', password: 'wrong' } });
check('wrong password -> 401', badLogin.status === 401);

const login = await call('/auth/login', { method: 'POST', body: { email: 'alice@test.com', password: 'secret123' } });
check('login ok', login.status === 200 && !!login.data.token);

const A = login.data.token, B = bob.data.token;
const me = await call('/auth/me', { token: A });
check('/auth/me returns alice', me.data.user?.username === 'alice');
check('/auth/me without token -> 401', (await call('/auth/me')).status === 401);

console.log('\n--- posts ---');
const empty = await call('/posts', { method: 'POST', body: {}, token: A });
check('empty post rejected -> 400', empty.status === 400, JSON.stringify(empty.data));

const textOnly = await call('/posts', { method: 'POST', body: { text: 'text only post' }, token: A });
check('text-only post ok', textOnly.status === 201, JSON.stringify(textOnly.data));

const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const imageOnly = await call('/posts', { method: 'POST', body: { image: tinyPng }, token: B });
check('image-only post ok', imageOnly.status === 201, JSON.stringify(imageOnly.data));

const bothPost = await call('/posts', { method: 'POST', body: { text: 'text + image', image: tinyPng }, token: A });
check('text+image post ok', bothPost.status === 201);

check('unauthenticated create -> 401', (await call('/posts', { method: 'POST', body: { text: 'nope' } })).status === 401);
check('bad image format -> 400', (await call('/posts', { method: 'POST', body: { image: 'data:text/html;base64,xx' }, token: A })).status === 400);

console.log('\n--- likes ---');
const pid = textOnly.data.post._id;
const like1 = await call(`/posts/${pid}/like`, { method: 'POST', token: B });
check('bob likes -> liked true, count 1', like1.data.liked === true && like1.data.likesCount === 1, JSON.stringify(like1.data));
check('like preview stores username', like1.data.likePreview?.includes('bob'), JSON.stringify(like1.data.likePreview));

const like2 = await call(`/posts/${pid}/like`, { method: 'POST', token: B });
check('same user likes again -> unlike, count 0', like2.data.liked === false && like2.data.likesCount === 0, JSON.stringify(like2.data));

await call(`/posts/${pid}/like`, { method: 'POST', token: B });
await call(`/posts/${pid}/like`, { method: 'POST', token: A });
const likeList = await call(`/posts/${pid}/likes`);
check('both likers saved with usernames', likeList.data.likes?.length === 2 && likeList.data.likes.every((l) => l.username), JSON.stringify(likeList.data.likes));

console.log('\n--- comments ---');
const c1 = await call(`/posts/${pid}/comments`, { method: 'POST', body: { text: 'nice one!' }, token: B });
check('comment created', c1.status === 201 && c1.data.commentsCount === 1, JSON.stringify(c1.data));
check('comment saves username', c1.data.comment?.username === 'bob');
check('empty comment -> 400', (await call(`/posts/${pid}/comments`, { method: 'POST', body: { text: '  ' }, token: A })).status === 400);
check('unauthenticated comment -> 401', (await call(`/posts/${pid}/comments`, { method: 'POST', body: { text: 'x' } })).status === 401);

for (let i = 0; i < 4; i++) {
  await call(`/posts/${pid}/comments`, { method: 'POST', body: { text: `comment ${i}` }, token: A });
}
const allComments = await call(`/posts/${pid}/comments`);
check('all 5 comments returned', allComments.data.comments?.length === 5, String(allComments.data.comments?.length));

console.log('\n--- feed + counts ---');
const feedAnon = await call('/posts?limit=10');
check('anonymous feed works', feedAnon.status === 200 && feedAnon.data.posts.length === 3);
check('anonymous likedByMe is false', feedAnon.data.posts.every((p) => p.likedByMe === false));
check('feed hides raw likes array', feedAnon.data.posts.every((p) => p.likes === undefined));
const feedPost = feedAnon.data.posts.find((p) => p._id === pid);
check('counts are correct on feed', feedPost.likesCount === 2 && feedPost.commentsCount === 5, JSON.stringify({ l: feedPost.likesCount, c: feedPost.commentsCount }));
check('feed ships only 2 preview comments', feedPost.comments.length === 2, String(feedPost.comments.length));
check('preview holds the NEWEST comments', feedPost.comments[1].text === 'comment 3', feedPost.comments.map((c) => c.text).join('|'));

const feedAlice = await call('/posts', { token: A });
check('likedByMe true for alice', feedAlice.data.posts.find((p) => p._id === pid).likedByMe === true);

console.log('\n--- pagination ---');
for (let i = 0; i < 12; i++) {
  await call('/posts', { method: 'POST', body: { text: `bulk ${i}` }, token: A });
}
const pages = [];
let cursor = null;
do {
  const qs = cursor ? `/posts?limit=5&cursor=${encodeURIComponent(cursor)}` : '/posts?limit=5';
  const page = await call(qs);
  pages.push(page.data);
  cursor = page.data.nextCursor;
} while (cursor && pages.length < 10);

check('page 1 has 5 + cursor', pages[0].posts.length === 5 && pages[0].hasMore && !!pages[0].nextCursor);
check('3 pages of 5 for 15 posts', pages.length === 3, String(pages.length));
const ids = pages.flatMap((p) => p.posts).map((p) => p._id);
check('pages cover all 15 posts', ids.length === 15, String(ids.length));
check('no duplicates across pages', new Set(ids).size === 15, String(new Set(ids).size));
check('last page hasMore=false', pages[2].hasMore === false && pages[2].nextCursor === null);
const times = pages.flatMap((p) => p.posts).map((p) => new Date(p.createdAt).getTime());
check('feed is newest-first', times.every((t, i) => i === 0 || times[i - 1] >= t));
check('bad cursor -> 400', (await call('/posts?cursor=notarealcursor')).status === 400);

const authorFeed = await call(`/posts?author=${me.data.user.id}`);
check('author filter returns only alice posts', authorFeed.data.posts.every((p) => p.authorUsername === 'alice'), JSON.stringify(authorFeed.data.posts.map((p) => p.authorUsername)));
check('author filter respects default page size of 10', authorFeed.data.posts.length === 10 && authorFeed.data.hasMore === true, String(authorFeed.data.posts.length));
const authorAll = await call(`/posts?author=${me.data.user.id}&limit=30`);
check('author filter finds all 14 of alice posts', authorAll.data.posts.length === 14, String(authorAll.data.posts.length));
check('invalid author id -> 400', (await call('/posts?author=abc')).status === 400);

console.log('\n--- delete ---');
check('non-owner delete -> 403', (await call(`/posts/${pid}`, { method: 'DELETE', token: B })).status === 403);
check('owner delete -> 200', (await call(`/posts/${pid}`, { method: 'DELETE', token: A })).status === 200);
check('deleted post is gone -> 404', (await call(`/posts/${pid}/comments`)).status === 404);

console.log('\n--- cors ---');
// A refused origin must NOT come back as a 500. A 500 carries no CORS headers at
// all, so the browser reports it as an unreachable server rather than a blocked
// origin - which is exactly what broke the first deployment.
const rawFetch = async (origin) => {
  const res = await fetch(`${BASE}/posts?limit=1`, { headers: origin ? { Origin: origin } : {} });
  return { status: res.status, acao: res.headers.get('access-control-allow-origin') };
};

const vercel = await rawFetch('https://social-app-jade-iota.vercel.app');
check('vercel origin -> 200 with CORS header', vercel.status === 200 && !!vercel.acao, JSON.stringify(vercel));
const netlify = await rawFetch('https://anything.netlify.app');
check('netlify origin allowed', netlify.status === 200 && !!netlify.acao, JSON.stringify(netlify));
const localhost = await rawFetch('http://localhost:5173');
check('localhost origin allowed', localhost.status === 200 && !!localhost.acao, JSON.stringify(localhost));
const unknown = await rawFetch('https://evil.example.com');
check('unknown origin -> 200 without CORS header, never a 500', unknown.status === 200 && !unknown.acao, JSON.stringify(unknown));
check('request with no Origin still works', (await rawFetch(null)).status === 200);
check('GET / is a friendly 200, not a 404', (await fetch('http://localhost:5099/')).status === 200);

console.log('\n--- collections ---');
const names = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name).sort();
check('exactly two collections (users, posts)', names.length === 2 && names.includes('users') && names.includes('posts'), names.join(','));

console.log(`\n${pass} passed, ${fail} failed\n`);
await mongoose.disconnect();
server.close();
await mem.stop();
process.exit(fail ? 1 : 0);
