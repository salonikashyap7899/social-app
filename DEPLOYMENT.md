# Deployment guide

Three pieces to host: the database (MongoDB Atlas), the API (Render), and the client
(Vercel or Netlify). Do them in that order — each one needs a URL from the previous step.

---

## 1. MongoDB Atlas (database)

1. Create a free account at <https://cloud.mongodb.com> and create an **M0 (free) cluster**.
2. **Database Access** → *Add New Database User*. Pick a username and a strong password, give
   it the **Read and write to any database** role. Note the password down.
3. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`).
   Render's outbound IPs are not fixed on the free plan, so an allowlist won't work.
4. **Database** → *Connect* → *Drivers* and copy the connection string. It looks like:

   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   Replace `<user>` and `<password>` with the credentials from step 2, and insert the
   database name before the `?`:

   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/socialapp?retryWrites=true&w=majority
   ```

   If the password contains `@`, `:`, `/` or `#`, URL-encode it (`@` → `%40`).

The `users` and `posts` collections are created automatically on first write — no setup needed.

---

## 2. Render (backend)

1. Push this repository to GitHub (public).
2. At <https://render.com> → **New** → **Web Service**, connect the repo.
3. Configure:

   | Field | Value |
   | --- | --- |
   | Root Directory | `backend` |
   | Environment | `Node` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | Free |

   (`render.yaml` at the repo root already encodes these if you prefer Render's Blueprint flow.)

4. Add the environment variables under **Environment**:

   | Key | Value |
   | --- | --- |
   | `MONGO_URI` | the Atlas string from step 1 |
   | `JWT_SECRET` | a long random string — e.g. `openssl rand -hex 32` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_ORIGINS` | your frontend URL (fill in after step 3, see below) |

   Don't set `PORT` — Render provides it and the server already reads `process.env.PORT`.

5. Deploy, then confirm `https://<your-service>.onrender.com/api/health` returns
   `{"status":"ok",...}`.

> **Free-plan note:** Render spins the instance down after ~15 minutes of inactivity, so the
> first request after an idle period takes 30–50 seconds. That is the cold start, not a bug.

---

## 3. Vercel (frontend)

1. At <https://vercel.com> → **Add New** → **Project**, import the same repository.
2. Configure:

   | Field | Value |
   | --- | --- |
   | Root Directory | `frontend` |
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

3. Add the environment variable:

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://<your-service>.onrender.com` (no trailing slash) |

4. Deploy. `frontend/vercel.json` already rewrites all routes to `index.html` so refreshing
   on `/profile` doesn't 404.

### Or Netlify instead

Same repo, **Base directory** `frontend`, **Build command** `npm run build`, **Publish
directory** `frontend/dist`, and the same `VITE_API_URL` variable.
`frontend/public/_redirects` handles the SPA fallback.

---

## 4. Close the loop on CORS

Go back to Render, set `CLIENT_ORIGINS` to your deployed frontend origin, and redeploy:

```
CLIENT_ORIGINS=https://your-app.vercel.app
```

Multiple origins are comma-separated — useful while you have both a Vercel and a Netlify
deployment, or a preview URL:

```
CLIENT_ORIGINS=https://your-app.vercel.app,https://your-app.netlify.app,http://localhost:5173
```

Use the origin only — scheme + host, **no trailing slash and no path**.

---

## Verifying the deployment

Walk the required flow end to end on the live site:

1. **Sign up** with a new email → you land on the feed already logged in.
2. **Create a post** with text only, then one with an image only, then one with both.
3. Open a **private/incognito window**, sign up as a second user, and confirm the first
   user's posts appear in the public feed.
4. **Like** and **comment** as the second user — the counts should update instantly.
5. Switch back to the first window, refresh, and confirm the like and comment are there with
   the second user's username attached.
6. **Refresh** the page — you should still be logged in (the JWT is restored).
7. Scroll past 10 posts to see the next page load automatically.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Frontend shows "Cannot reach the server" | Backend asleep (wait ~40s and retry) or `VITE_API_URL` is wrong. It must be set at **build** time — change it in Vercel and redeploy, not just save it. |
| Browser console: blocked by CORS policy | `CLIENT_ORIGINS` on Render doesn't exactly match the frontend origin. No trailing slash. |
| Render logs: `MongoServerError: bad auth` | Wrong Atlas username/password, or an unencoded special character in the password. |
| Render logs: `Could not connect to any servers` | Atlas Network Access is missing `0.0.0.0/0`. |
| Render exits with "Missing MONGO_URI or JWT_SECRET" | An environment variable is unset or was added without redeploying. |
| Refreshing `/profile` gives 404 | The SPA rewrite is missing — check `vercel.json` / `_redirects` shipped with the build. |
| "Image is too large" when posting | The source photo is very large; the client downscales to 1280px but the ~2MB cap still applies. |
