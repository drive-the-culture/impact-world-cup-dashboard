-- Impact World Cup — Row Level Security
--
-- Read model:
--   • teams, categories, actions, view_tiers, multiplier_events
--                                  — public read
--   • impact_events                — public read, ONLY non-deleted rows
--   • submissions, admins          — NO public read
--
-- Write model:
--   • submissions                  — anyone (anon) may INSERT (public form)
--   • everything else              — service_role only
--
-- The service_role key bypasses RLS, so admin mutations don't need policies.

alter table public.teams              enable row level security;
alter table public.categories         enable row level security;
alter table public.actions            enable row level security;
alter table public.view_tiers         enable row level security;
alter table public.multiplier_events  enable row level security;
alter table public.submissions        enable row level security;
alter table public.impact_events      enable row level security;
alter table public.admins             enable row level security;

create policy "teams_public_read"
  on public.teams for select to anon, authenticated using (true);

create policy "categories_public_read"
  on public.categories for select to anon, authenticated using (true);

create policy "actions_public_read"
  on public.actions for select to anon, authenticated
  using (is_active);

create policy "view_tiers_public_read"
  on public.view_tiers for select to anon, authenticated using (true);

create policy "multiplier_events_public_read"
  on public.multiplier_events for select to anon, authenticated using (true);

create policy "impact_events_public_read_active"
  on public.impact_events for select to anon, authenticated
  using (deleted_at is null);

-- Public form may INSERT a pending submission. The submitted_* snapshot cols
-- must match the live cols at insert time so we can detect admin edits later.
create policy "submissions_public_insert"
  on public.submissions for insert to anon, authenticated
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and submitted_action_type = action_type
    and submitted_metric_value is not distinct from metric_value
    and submitted_bonus_flags = bonus_flags
  );

-- No public select / update / delete on submissions or admins.
