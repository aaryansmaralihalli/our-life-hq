# Supabase Setup — Shared Bucket List with Private Login

This connects your `index.html` to a free Supabase backend so **both of you log in with email + password and see the same shared bucket list and photos on any device.**

Until you finish this, the page happily runs in **local mode** (this device only, no login). Once you paste your two keys in step 4, it switches to the shared, synced, login-protected version automatically.

⏱️ ~5 minutes. No credit card needed.

---

## 1. Create the project
1. Go to **https://supabase.com** → **Sign in / Start your project** (sign up with email or GitHub).
2. Click **New project**.
3. Name it (e.g. `bucket-list`), set a **database password** (save it somewhere — you won't need it for the app), pick the closest region, click **Create new project**. Wait ~1 minute for it to spin up.

## 2. Create the table, security rules & storage
1. In the left sidebar click **SQL Editor** → **New query**.
2. Paste the entire block below and click **Run**.

```sql
-- Bucket list items (shared by all signed-in users)
create table if not exists public.bucket_items (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  done boolean not null default false,
  completed_at timestamptz,
  memory text not null default '',
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Lock the table down...
alter table public.bucket_items enable row level security;

-- ...then allow any *signed-in* user full access (the two of you share one list)
drop policy if exists "authenticated full access" on public.bucket_items;
create policy "authenticated full access"
  on public.bucket_items for all
  to authenticated
  using (true) with check (true);

-- Live sync across devices
alter publication supabase_realtime add table public.bucket_items;

-- Private storage bucket for memory photos
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

-- Signed-in users can read/upload/delete photos
drop policy if exists "memories read"   on storage.objects;
drop policy if exists "memories insert" on storage.objects;
drop policy if exists "memories delete" on storage.objects;
create policy "memories read"   on storage.objects for select to authenticated using (bucket_id = 'memories');
create policy "memories insert" on storage.objects for insert to authenticated with check (bucket_id = 'memories');
create policy "memories delete" on storage.objects for delete to authenticated using (bucket_id = 'memories');
```

You should see **Success. No rows returned.**

## 3. Create your two accounts & lock out strangers
1. Left sidebar → **Authentication** → **Users** → **Add user** → **Create new user**.
   - Enter your email + a password, tick **Auto Confirm User**, create. Repeat for your partner.
2. Keep it private: left sidebar → **Authentication** → **Sign In / Providers** (or **Settings**) → find **Allow new users to sign up** and turn it **OFF**. Now only the two accounts you created can ever log in.
   - *(Optional but recommended: also disable "Confirm email" so logins are instant.)*

## 4. Paste your keys into the app
1. Left sidebar → **Project Settings** (gear) → **API**.
2. Copy two values:
   - **Project URL** (e.g. `https://kztzjzxghxwoaoeifthq.supabase.co`)
   - **anon public** key (a long string — *not* the `service_role` key!)
3. Open `index.html`, find this block near the top of the `<script>`:

```js
const SUPABASE_URL = "https://kztzjzxghxwoaoeifthq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6dHpqenhnaHh3b2FvZWlmdGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzUyMzAsImV4cCI6MjA5NTgxMTIzMH0._R7VMbfpgOUHrJQbKMwN-_hYQPCxloFgvZa_R3ff9MM";
``` - ive added everything

   Replace the two placeholder strings with your real values (keep the quotes). Save.

## 5. Done 🎉
Open `index.html` again — you'll now get a **sign-in screen**. Log in with one of the accounts you made. Add a dream on your laptop and watch it appear on your phone after you log in there too.

---

### Notes
- The **anon public** key is safe to ship in front-end code — your data is protected by the login + row-level security rules above, not by hiding the key.
- Photos are downscaled in the browser before upload (longest edge ≤ 1000px) to save space and bandwidth.
- The `service_role` key is a master key — **never** put it in `index.html` or share it.
- When you deploy (e.g. Cloudflare Pages, per the main context doc), no extra steps are needed — the same `index.html` just works once the keys are in it.
