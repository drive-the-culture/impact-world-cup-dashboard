-- Impact World Cup — Row Level Security policies
--
-- Read model:
--   • teams                   — public read
--   • scoring_rules           — public read (drives dropdowns + donut labels)
--   • impact_events           — public read, ONLY non-deleted rows
--   • submissions             — NO public read
--   • admins                  — NO public read
--
-- Write model:
--   • submissions             — anyone (anon) may INSERT (form post)
--   • everything else         — service_role only (admin mutations go through
--                               server-side API routes that use the service key)
--
-- The service_role key bypasses RLS, so admin operations don't need policies.

alter table public.teams            enable row level security;
alter table public.scoring_rules    enable row level security;
alter table public.submissions      enable row level security;
alter table public.impact_events    enable row level security;
alter table public.admins           enable row level security;

-- ---------------------------------------------------------------------------
-- teams: public read
-- ---------------------------------------------------------------------------
create policy "teams_public_read"
  on public.teams for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- scoring_rules: public read
-- ---------------------------------------------------------------------------
create policy "scoring_rules_public_read"
  on public.scoring_rules for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- impact_events: public read of non-deleted rows
-- ---------------------------------------------------------------------------
create policy "impact_events_public_read_active"
  on public.impact_events for select
  to anon, authenticated
  using (deleted_at is null);

-- ---------------------------------------------------------------------------
-- submissions: insert-only for the public form.
-- Insert is gated to the columns the form actually sets — submitted_value
-- and submitted_type are populated server-side from value/type, so we just
-- require the basics here. Status must default to 'pending' (no client
-- overrides). reviewed_by/reviewed_at must be null at insert time.
-- ---------------------------------------------------------------------------
create policy "submissions_public_insert"
  on public.submissions for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and submitted_value = value
    and submitted_type = type
  );

-- No public select / update / delete on submissions or admins.
-- Admins must read these via the service_role client in server code.
