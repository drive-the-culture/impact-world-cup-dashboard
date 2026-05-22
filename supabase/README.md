# Supabase setup

One-time setup for the Impact World Cup dashboard's database.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (free tier is fine).
2. Pick a region near Houston (e.g., `us-east-1`).
3. Save the database password somewhere you'll find it.

## 2. Run the migrations

In the Supabase dashboard, open **SQL Editor** and run each file in order:

1. `migrations/0001_init_schema.sql` — tables (categories, actions, view_tiers,
   multiplier_events, teams, submissions, impact_events, admins)
2. `migrations/0002_rls_policies.sql` — Row Level Security
3. `migrations/0003_seed.sql` — Chris's full rubric (categories, ~50 actions,
   view tiers), 30 placeholder teams, first admin email

See [`SCORING_RUBRIC.md`](./SCORING_RUBRIC.md) for the source rubric that
drives the seed data.

## 3. Enable Realtime on `impact_events`

In **Database → Replication**, toggle Realtime ON for `public.impact_events`.
The public dashboard subscribes to inserts on this table.

## 4. Create the screenshots storage bucket

In **Storage**, create a bucket:

- Name: `submission-screenshots`
- Public: **yes**
- File size limit: `5 MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp`

## 5. Wire keys into the app

Copy `.env.example` → `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Settings → API → `anon` `public`
- `SUPABASE_SERVICE_ROLE_KEY` — Settings → API → `service_role` (keep secret)

## Adding more admins later

```sql
insert into public.admins (email, added_by)
values ('new-admin@example.com', 'alexander.taylor@utexas.edu');
```
