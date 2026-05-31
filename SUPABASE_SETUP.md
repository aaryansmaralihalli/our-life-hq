# Supabase + Hosting Setup — Our Life HQ

Your Supabase project is already created and your keys are wired into the app
(`.env` for local dev, `.env.production` for the hosted build). Two things remain
to make the **live** site fully work.

Project URL: `https://kztzjzxghxwoaoeifthq.supabase.co`

---

## ✅ Step 1 — Create the database tables (REQUIRED)

Right now only an old `bucket_items` table exists, and it has the wrong shape.
The full app needs **6 tables**. Fix this in one paste:

1. Supabase → **SQL Editor** → **New query**.
2. Open [`supabase_schema.sql`](supabase_schema.sql), copy the whole file, paste, **Run**.
   - It drops the old `bucket_items`, creates all 6 tables
     (`profiles`, `bucket_items`, `food_spots`, `destinations`, `gym_entries`,
     `health_entries`), and turns on row-level security so only signed-in users
     can read/write — and the two of you share one dataset.
3. You should see **Success. No rows returned.**

> Re-running it later is safe; it only resets `bucket_items`.

## ✅ Step 2 — Create your two logins (REQUIRED)

1. Supabase → **Authentication → Users → Add user → Create new user**.
   - Enter email + password, tick **Auto Confirm User**. Repeat for your partner.
2. Lock it down: **Authentication → Sign In / Providers** → turn **Allow new
   users to sign up** **OFF**. Now only your two accounts can ever log in.

That's the backend done. The app shows a sign-in screen and, once you log in,
syncs everything between your phones and laptops.

---

## ✅ Step 3 — Host it on Cloudflare Pages

The code lives on GitHub at **our-life-hq** (private).

1. Go to **https://dash.cloudflare.com** → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git**.
2. Authorise GitHub and pick the **our-life-hq** repo.
3. Build settings:
   - **Framework preset:** Vite (or "None")
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Save and Deploy.** In ~1 minute you get a live URL like
   `our-life-hq.pages.dev`. Every future `git push` auto-redeploys.

The Supabase keys are baked into the build via `.env.production`, so you do **not**
need to add environment variables in Cloudflare. (If you'd rather keep them out of
git, delete `.env.production` and instead add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` under the Pages project's **Settings → Variables**.)

Client-side routing (e.g. refreshing `/gym`) works because `public/_redirects`
sends all paths to `index.html`.

---

### Notes
- The **anon public** key is safe to expose — it ships in the browser and is
  protected by the row-level-security rules in Step 1. The `service_role` key is
  the master key; never put it in this repo.
- Keep the site truly private by only creating your two accounts (Step 2) and
  disabling sign-ups. You can also add Cloudflare **Access** rules to gate the URL
  by email for belt-and-suspenders.
