-- Impact World Cup — seed data
-- All values here are PLACEHOLDERS pending official rubric + real team roster.
-- The is_placeholder flag on scoring_rules drives the "awaiting official
-- rubric" banner in /admin/scoring.

-- ---------------------------------------------------------------------------
-- scoring_rules (6 categories from the launch infographic)
-- ---------------------------------------------------------------------------
insert into public.scoring_rules (type, label, unit, points_per_unit, sort_order, is_placeholder) values
  ('volunteering',       'Volunteering',          'hours',          10,  1, true),
  ('creator_content',    'Creator Content',       'posts',           5,  2, true),
  ('community_events',   'Community Events',      'events',        100,  3, true),
  ('tourism_checkins',   'Tourism & Check-ins',   'check-ins',       2,  4, true),
  ('mentorship',         'Mentorship',            'mentorship hrs', 15,  5, true),
  ('donations_support',  'Donations & Support',   'dollars',         0.1, 6, true);

-- ---------------------------------------------------------------------------
-- teams (30 placeholders — rename via admin UI / SQL once real roster is set)
-- ---------------------------------------------------------------------------
insert into public.teams (name, slug)
select
  format('Team %02s', i),
  format('team-%02s', i)
from generate_series(1, 30) as i;

-- ---------------------------------------------------------------------------
-- admins (seed: project owner only; add collaborators on Day 7)
-- ---------------------------------------------------------------------------
insert into public.admins (email, added_by) values
  ('alexander.taylor@utexas.edu', 'seed');
