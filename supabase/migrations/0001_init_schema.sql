-- Impact World Cup — initial schema
-- Action-based, auto-computable scoring model.
--
-- Categories  ← 8 buckets from Chris's rubric (drives the donut chart)
-- Actions     ← ~60 specific actions (e.g., "Instagram Reel", "Volunteer participation")
-- View tiers  ← step function for engagement scoring
-- Multiplier events  ← admin-toggled Double XP date ranges
-- Teams, Creators (lite), Admins
-- Submissions ← creator-submitted, with deterministic computed_points snapshot
-- Impact events ← the ledger (public dashboard reads from here)

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  type        text primary key,
  label       text not null,
  emoji       text,
  sort_order  smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- actions — every submittable thing (base actions + Speed-of-Impact bonuses).
-- metric_kind drives form fields and the compute function:
--   'none'      → fixed base_points, no extra fields
--   'views'     → base_points + tier lookup (via view_tiers)
--   'per_unit'  → base_points + (metric_value * per_unit_points)
-- is_bonus       → Speed-of-Impact items; not pickable as the primary action
-- is_subjective  → admin-only awards (e.g. "Best cinematic edit")
-- ---------------------------------------------------------------------------
create table public.actions (
  type             text primary key,
  category         text not null references public.categories(type) on update cascade,
  label            text not null,
  base_points      integer not null default 0,
  per_unit_points  numeric,
  metric_kind      text not null default 'none'
                     check (metric_kind in ('none', 'views', 'per_unit')),
  metric_label     text,
  is_bonus         boolean not null default false,
  is_subjective    boolean not null default false,
  is_active        boolean not null default true,
  sort_order       smallint not null default 0,
  updated_at       timestamptz not null default now()
);

create index actions_category_idx on public.actions (category);
create index actions_active_idx   on public.actions (is_active) where is_active;

-- ---------------------------------------------------------------------------
-- view_tiers — engagement step function. The highest tier whose min_views
-- is <= the submission's view count wins.
-- ---------------------------------------------------------------------------
create table public.view_tiers (
  id          smallserial primary key,
  label       text not null,
  min_views   integer not null,
  points      integer not null,
  unique (min_views)
);

-- ---------------------------------------------------------------------------
-- multiplier_events — Double XP days, finals watch parties, etc.
-- A submission approved while `now()` is between starts_at and ends_at gets
-- multiplied. If multiple overlap, the highest multiplier wins.
-- ---------------------------------------------------------------------------
create table public.multiplier_events (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  multiplier  numeric not null check (multiplier > 0),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null check (ends_at > starts_at),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index multiplier_events_window_idx
  on public.multiplier_events (starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------------
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  logo_url    text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- submissions
--   action_type      = primary action (NOT is_bonus, NOT is_subjective)
--   metric_value     = views / scans / dollars / hours — interpretation
--                      depends on the action's metric_kind
--   bonus_flags      = array of action_type slugs (is_bonus=true) that stack
--   computed_points  = points snapshot at submission time (live preview)
--
--   submitted_*      = frozen at insert for audit; admin can edit the live
--                      cols before approving.
-- ---------------------------------------------------------------------------
create table public.submissions (
  id                       uuid primary key default gen_random_uuid(),
  team_id                  uuid not null references public.teams(id) on delete restrict,
  creator_name             text,
  action_type              text not null references public.actions(type) on update cascade,
  post_url                 text,
  metric_value             numeric,
  bonus_flags              text[] not null default '{}',
  description              text,
  screenshot_url           text,
  submitter_email          text,

  submitted_action_type    text not null,
  submitted_metric_value   numeric,
  submitted_bonus_flags    text[] not null default '{}',
  computed_points          integer not null default 0,

  status                   text not null default 'pending'
                              check (status in ('pending', 'approved', 'rejected')),
  reviewed_by              uuid references auth.users(id) on delete set null,
  reviewed_at              timestamptz,
  rejection_reason         text,

  created_at               timestamptz not null default now()
);

create index submissions_status_created_idx
  on public.submissions (status, created_at desc);
create index submissions_team_idx
  on public.submissions (team_id);

-- ---------------------------------------------------------------------------
-- impact_events — the ledger.
-- points_breakdown is the structured trace of how `points` was computed:
--   { base, view_tier, per_unit, speed_bonuses, multiplier, total }
-- so the admin UI can show the math when reviewing or auditing.
-- ---------------------------------------------------------------------------
create table public.impact_events (
  id                    uuid primary key default gen_random_uuid(),
  team_id               uuid not null references public.teams(id) on delete restrict,
  creator_name          text,
  action_type           text not null references public.actions(type) on update cascade,
  points                integer not null,
  points_breakdown      jsonb not null default '{}'::jsonb,
  source_submission_id  uuid not null references public.submissions(id) on delete restrict,

  created_by            uuid references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),

  deleted_at            timestamptz,
  deleted_by            uuid references auth.users(id) on delete set null,
  deletion_reason       text
);

create index impact_events_team_active_idx
  on public.impact_events (team_id) where deleted_at is null;
create index impact_events_created_at_active_idx
  on public.impact_events (created_at desc) where deleted_at is null;
create index impact_events_action_active_idx
  on public.impact_events (action_type) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- admins — allowlist checked in proxy.ts
-- ---------------------------------------------------------------------------
create table public.admins (
  email      text primary key,
  added_at   timestamptz not null default now(),
  added_by   text
);
