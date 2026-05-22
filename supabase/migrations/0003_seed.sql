-- Impact World Cup — seed data
-- Encodes Chris's Impact Points™ Scoring Rubric (see supabase/SCORING_RUBRIC.md).
-- Action point values are derived directly from the rubric. Adjust here when
-- the rubric changes — the app computes scores deterministically from this
-- data, so no code change is needed for routine tuning.

-- ---------------------------------------------------------------------------
-- categories — the 8 rubric buckets, drives the donut chart + form grouping
-- ---------------------------------------------------------------------------
insert into public.categories (type, label, emoji, sort_order) values
  ('content_creation',    'Content Creation',         '🎥', 1),
  ('engagement',          'Engagement Performance',   '🚀', 2),
  ('hidden_gems',         'Hidden Gems of Houston',   '📍', 3),
  ('community_impact',    'Community Impact',         '🤝', 4),
  ('speed_of_impact',     'Speed of Impact',          '⚡', 5),
  ('team_support',        'Team Support',             '🏆', 6),
  ('culture_creativity',  'Culture & Creativity',     '🎨', 7),
  ('tourism_impact',      'Tourism Impact',           '🌎', 8);

-- ---------------------------------------------------------------------------
-- view_tiers — engagement step function (highest matching tier wins)
-- ---------------------------------------------------------------------------
insert into public.view_tiers (label, min_views, points) values
  ('1K views',     1000,    25),
  ('10K views',    10000,   100),
  ('50K views',    50000,   300),
  ('100K views',   100000,  750),
  ('500K+ views',  500000,  2500);

-- ---------------------------------------------------------------------------
-- actions
--   metric_kind:  none    → fixed base_points only
--                 views   → fixed base_points + view-tier bonus
--                 per_unit → base_points + (metric_value * per_unit_points)
--   is_bonus:    flags that stack on top of a primary action
--   is_subjective: admin-only awards (no public submission)
-- ---------------------------------------------------------------------------

-- 1. Content Creation
insert into public.actions (type, category, label, base_points, metric_kind, metric_label, sort_order) values
  ('instagram_story',       'content_creation', 'Instagram Story',       10,  'views', 'Total views', 110),
  ('instagram_reel',        'content_creation', 'Instagram Reel',        100, 'views', 'Total views', 120),
  ('tiktok_video',          'content_creation', 'TikTok Video',          100, 'views', 'Total views', 130),
  ('youtube_short',         'content_creation', 'YouTube Short',         125, 'views', 'Total views', 140),
  ('youtube_vlog',          'content_creation', 'YouTube Vlog',          300, 'views', 'Total views', 150),
  ('podcast_appearance',    'content_creation', 'Podcast Appearance',    250, 'views', 'Total views', 160),
  ('livestream_session',    'content_creation', 'Livestream Session',    300, 'views', 'Peak viewers', 170),
  ('drone_cinematic_edit',  'content_creation', 'Drone / Cinematic Edit', 400, 'views', 'Total views', 180);

-- 2. Engagement Performance — modifiers on top of content posts (bonuses)
insert into public.actions (type, category, label, base_points, is_bonus, sort_order) values
  ('high_comment_engagement', 'engagement', 'High comment engagement', 100, true, 210),
  ('high_share_save_rate',    'engagement', 'High share/save rate',    150, true, 220);

-- 3. Hidden Gems of Houston
insert into public.actions (type, category, label, base_points, per_unit_points, metric_kind, metric_label, sort_order) values
  ('hidden_gem_feature',        'hidden_gems', 'Hidden Gem location feature', 150, null,  'views',    'Total views', 310),
  ('restaurant_spotlight',      'hidden_gems', 'Restaurant spotlight',         125, null,  'views',    'Total views', 320),
  ('nonprofit_spotlight',       'hidden_gems', 'Nonprofit spotlight',          250, null,  'views',    'Total views', 330),
  ('tourism_route_stop',        'hidden_gems', 'Tourism route stop',           100, null,  'views',    'Total views', 340),
  ('small_business_interview',  'hidden_gems', 'Small business interview',     200, null,  'views',    'Total views', 350),
  ('creator_route_completion',  'hidden_gems', 'Creator route completion',     500, null,  'none',     null,          360),
  ('qr_code_scans',             'hidden_gems', 'QR code scans generated',      0,   10,    'per_unit', 'QR scans',    370);

-- 4. Community Impact
insert into public.actions (type, category, label, base_points, metric_kind, metric_label, sort_order) values
  ('volunteer_participation',         'community_impact', 'Volunteer participation',                 250, 'views', 'Total views', 410),
  ('community_event_attendance',      'community_impact', 'Community event attendance',              100, 'views', 'Total views', 420),
  ('nonprofit_fundraising_support',   'community_impact', 'Nonprofit fundraising support',           400, 'views', 'Total views', 430),
  ('youth_mentorship_feature',        'community_impact', 'Youth mentorship feature',                300, 'views', 'Total views', 440),
  ('workforce_development_feature',   'community_impact', 'Workforce development feature',           250, 'views', 'Total views', 450),
  ('veteran_community_support',       'community_impact', 'Veteran/community support content',       300, 'views', 'Total views', 460),
  ('mental_health_content',           'community_impact', 'Mental health / community healing',       300, 'views', 'Total views', 470);

-- 5. Speed of Impact — stacking bonuses (submitter checks the box, system adds)
insert into public.actions (type, category, label, base_points, is_bonus, sort_order) values
  ('first_creator_to_post',         'speed_of_impact', 'First creator to post from event', 250, true, 510),
  ('same_day_event_recap',          'speed_of_impact', 'Same-day event recap',             150, true, 520),
  ('livestream_during_activation',  'speed_of_impact', 'Livestream during live activation', 200, true, 530),
  ('fastest_trending_creator',      'speed_of_impact', 'Fastest trending creator of week',  500, true, 540),
  ('realtime_challenge_completion', 'speed_of_impact', 'Real-time challenge completion',   300, true, 550),
  ('viral_post_24hr',               'speed_of_impact', 'Viral post within 24 hours',       500, true, 560);

-- 6. Team Support
insert into public.actions (type, category, label, base_points, metric_kind, metric_label, sort_order) values
  ('team_captain_feature',           'team_support', 'Team Captain feature',           150, 'views', 'Total views', 610),
  ('team_nonprofit_feature',         'team_support', 'Team nonprofit feature',         250, 'views', 'Total views', 620),
  ('sponsor_feature_integration',    'team_support', 'Sponsor feature integration',    100, 'views', 'Total views', 630),
  ('team_collaboration_post',        'team_support', 'Team collaboration post',        150, 'views', 'Total views', 640),
  ('multi_creator_collaboration',    'team_support', 'Multi-creator collaboration',    250, 'views', 'Total views', 650),
  ('team_chant_song_participation',  'team_support', 'Team chant / song participation', 100, 'views', 'Total views', 660);

-- 7. Culture & Creativity — admin-only weekly awards (not on public form)
insert into public.actions (type, category, label, base_points, is_subjective, sort_order) values
  ('best_cinematic_edit',         'culture_creativity', 'Best cinematic edit',         500, true, 710),
  ('most_creative_storytelling',  'culture_creativity', 'Most creative storytelling',  500, true, 720),
  ('funniest_moment',             'culture_creativity', 'Funniest moment',             250, true, 730),
  ('best_hidden_gem_discovery',   'culture_creativity', 'Best hidden gem discovery',   500, true, 740),
  ('best_houston_culture_feature','culture_creativity', 'Best Houston culture feature',500, true, 750),
  ('ai_anthem_song_use',          'culture_creativity', 'AI-generated anthem/song use',150, true, 760),
  ('best_community_interview',    'culture_creativity', 'Best community interview',    300, true, 770);

-- 8. Tourism Impact
insert into public.actions (type, category, label, base_points, metric_kind, metric_label, is_active, sort_order) values
  ('out_of_town_audience_engagement', 'tourism_impact', 'Out-of-town audience engagement', 250, 'views', 'Total views', true,  810),
  ('tourism_recommendation_content',  'tourism_impact', 'Tourism recommendation content',  150, 'views', 'Total views', true,  820),
  ('hidden_destination_feature',      'tourism_impact', 'Hidden destination feature',      200, 'views', 'Total views', true,  830),
  ('hotel_hospitality_collaboration', 'tourism_impact', 'Hotel/hospitality collaboration', 150, 'views', 'Total views', true,  840),
  ('travel_creator_collaboration',    'tourism_impact', 'Travel creator collaboration',    300, 'views', 'Total views', true,  850),
  -- Deferred: needs an offline conversion tracking mechanism (rubric: "+tracked bonus")
  ('event_attendance_conversion',     'tourism_impact', 'Event attendance conversion',     0,   'none',  null,           false, 860);

-- ---------------------------------------------------------------------------
-- teams — 30 placeholders; rename via admin once Chris confirms roster
-- ---------------------------------------------------------------------------
insert into public.teams (name, slug)
select format('Team %02s', i), format('team-%02s', i)
from generate_series(1, 30) as i;

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------
insert into public.admins (email, added_by) values
  ('alexander.taylor@utexas.edu', 'seed');
