-- Impact World Cup — initial schema
-- Tables: teams, scoring_rules, submissions, impact_events, admins
-- Public dashboard reads from teams + impact_events (non-deleted).
-- Anonymous users can INSERT into submissions only.
-- Admins (server-side via service role) manage submissions/impact_events/scoring_rules.

set check_function_bodies = off;

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
-- scoring_rules — tunable by admin without redeploying.
-- `type` is the canonical category key; `unit` describes what `value` means.
-- `is_placeholder` flips to false when the official rubric is in.
-- ---------------------------------------------------------------------------
create table public.scoring_rules (
  type             text primary key,
  label            text not null,
  unit             text not null,
  points_per_unit  numeric not null check (points_per_unit >= 0),
  sort_order       smallint not null default 0,
  is_placeholder   boolean not null default true,
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- submissions — pending review queue.
-- `submitted_value`/`submitted_type` freeze original input so admin edits
-- before approval remain auditable.
-- ---------------------------------------------------------------------------
create table public.submissions (
  id                uuid primary key default gen_random_uuid(),
  team_id           uuid not null references public.teams(id) on delete restrict,
  type              text not null references public.scoring_rules(type) on update cascade,
  value             numeric not null check (value >= 0),
  description       text,
  screenshot_url    text,
  submitter_email   text,

  submitted_value   numeric not null,
  submitted_type    text not null,

  status            text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  reviewed_by       uuid references auth.users(id) on delete set null,
  reviewed_at       timestamptz,
  rejection_reason  text,

  created_at        timestamptz not null default now()
);

create index submissions_status_created_at_idx
  on public.submissions (status, created_at desc);
create index submissions_team_idx
  on public.submissions (team_id);

-- ---------------------------------------------------------------------------
-- impact_events — the points ledger. Public dashboard reads from here.
-- Soft-delete via `deleted_at` is how admins reverse a bad approval.
-- ---------------------------------------------------------------------------
create table public.impact_events (
  id                    uuid primary key default gen_random_uuid(),
  team_id               uuid not null references public.teams(id) on delete restrict,
  type                  text not null references public.scoring_rules(type) on update cascade,
  points                numeric not null,
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
create index impact_events_type_active_idx
  on public.impact_events (type) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- admins — allowlist checked in middleware/proxy.
-- ---------------------------------------------------------------------------
create table public.admins (
  email      text primary key,
  added_at   timestamptz not null default now(),
  added_by   text
);
