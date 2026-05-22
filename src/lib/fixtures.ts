// Mock fixtures used when NEXT_PUBLIC_SUPABASE_URL is the placeholder.
// Lets the dashboard render believable data for local dev / screenshots
// before the real Supabase project is provisioned. Shape matches the
// types in ./types.ts so the queries.ts swap to live data is transparent.

import type {
  Action,
  Category,
  FeedEntry,
  ImpactEvent,
  LeaderboardRow,
  CategoryBreakdown,
  Team,
  ViewTier,
} from './types';

export function isUsingPlaceholderSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url === '' || url.includes('placeholder');
}

export const mockCategories: Category[] = [
  { type: 'content_creation',    label: 'Content Creation',       emoji: '🎥', sort_order: 1 },
  { type: 'engagement',          label: 'Engagement Performance', emoji: '🚀', sort_order: 2 },
  { type: 'hidden_gems',         label: 'Hidden Gems of Houston', emoji: '📍', sort_order: 3 },
  { type: 'community_impact',    label: 'Community Impact',       emoji: '🤝', sort_order: 4 },
  { type: 'speed_of_impact',     label: 'Speed of Impact',        emoji: '⚡', sort_order: 5 },
  { type: 'team_support',        label: 'Team Support',           emoji: '🏆', sort_order: 6 },
  { type: 'culture_creativity',  label: 'Culture & Creativity',   emoji: '🎨', sort_order: 7 },
  { type: 'tourism_impact',      label: 'Tourism Impact',         emoji: '🌎', sort_order: 8 },
];

export const mockViewTiers: ViewTier[] = [
  { id: 1, label: '1K views',    min_views: 1000,   points: 25 },
  { id: 2, label: '10K views',   min_views: 10000,  points: 100 },
  { id: 3, label: '50K views',   min_views: 50000,  points: 300 },
  { id: 4, label: '100K views',  min_views: 100000, points: 750 },
  { id: 5, label: '500K+ views', min_views: 500000, points: 2500 },
];

// Trimmed subset of actions — full set is in 0003_seed.sql.
// Enough to render the dashboard + category breakdown.
export const mockActions: Action[] = [
  ['instagram_reel',           'content_creation', 'Instagram Reel',           100, 'views'],
  ['tiktok_video',             'content_creation', 'TikTok Video',             100, 'views'],
  ['youtube_vlog',             'content_creation', 'YouTube Vlog',             300, 'views'],
  ['livestream_session',       'content_creation', 'Livestream Session',       300, 'views'],
  ['nonprofit_spotlight',      'hidden_gems',      'Nonprofit spotlight',      250, 'views'],
  ['hidden_gem_feature',       'hidden_gems',      'Hidden Gem location feature', 150, 'views'],
  ['qr_code_scans',            'hidden_gems',      'QR code scans generated',  0,   'per_unit'],
  ['volunteer_participation',  'community_impact', 'Volunteer participation',  250, 'views'],
  ['team_collaboration_post',  'team_support',     'Team collaboration post',  150, 'views'],
].map(([type, category, label, base_points, metric_kind], i) => ({
  type: type as string,
  category: category as string,
  label: label as string,
  base_points: base_points as number,
  per_unit_points: type === 'qr_code_scans' ? 10 : null,
  metric_kind: metric_kind as Action['metric_kind'],
  metric_label: metric_kind === 'views' ? 'Total views' : metric_kind === 'per_unit' ? 'QR scans' : null,
  is_bonus: false,
  is_subjective: false,
  is_active: true,
  sort_order: 100 + i * 10,
  updated_at: new Date().toISOString(),
}));

const TEAMS: Team[] = [3, 7, 12, 19, 25].map((n) => {
  const padded = String(n).padStart(2, '0');
  return {
    id: `team-${padded}`,
    name: `Team ${padded}`,
    slug: `team-${padded}`,
    logo_url: null,
    created_at: new Date().toISOString(),
  };
});

// Mock impact_events — believable spread across teams + categories.
const NOW = Date.now();
const minutesAgo = (n: number) => new Date(NOW - n * 60_000).toISOString();

const MOCK_EVENTS: ImpactEvent[] = [
  ['team-19', 'tiktok_video',            2600,   8, 'Jasmine R.', 'Behind-the-scenes from Pitch 25 watch party — went viral overnight.'],
  ['team-07', 'youtube_vlog',            2800,  42, 'Marcus T.',  'Day-in-the-life of a Houston creator visiting 4 hidden gems.'],
  ['team-03', 'instagram_reel',          1250,  90, 'Devon K.',   'Camp Hope Coalition veterans wellness event recap.'],
  ['team-03', 'nonprofit_spotlight',      550, 180, 'Devon K.',   'Spotlight on a 3rd-ward youth literacy nonprofit.'],
  ['team-12', 'qr_code_scans',            500, 240, 'Sara L.',    'Hidden gems tourism route — 50 scans generated.'],
  ['team-12', 'volunteer_participation',  250, 360, 'Sara L.',    'Team showed up at McNair Park community day.'],
  ['team-19', 'livestream_session',       400, 480, 'Jasmine R.', 'Live from South Houston Tennis Academy STEM workshop.'],
  ['team-25', 'hidden_gem_feature',       175, 720, 'Andre M.',   'East End taqueria nobody knows about.'],
  ['team-07', 'team_collaboration_post',  150, 900, 'Marcus T.',  'Cross-team collab with Team 12.'],
].map(([team_id, action_type, points, mins, creator, desc], i) => ({
  id: `evt-${i}`,
  team_id: team_id as string,
  creator_name: creator as string,
  action_type: action_type as string,
  points: points as number,
  points_breakdown: { base: 0, view_tier: 0, per_unit: 0, speed_bonuses: 0, multiplier: 1, subtotal: points as number, total: points as number },
  source_submission_id: `sub-${i}`,
  created_by: null,
  created_at: minutesAgo(mins as number),
  deleted_at: null,
  deleted_by: null,
  deletion_reason: null,
}));

export const mockTeams = TEAMS;
export const mockImpactEvents = MOCK_EVENTS;

// ---------------------------------------------------------------------------
// Derived aggregations — match the shape of the live SQL queries.
// ---------------------------------------------------------------------------

export function mockLeaderboard(): LeaderboardRow[] {
  const byTeam = new Map<string, LeaderboardRow>();
  for (const t of TEAMS) {
    byTeam.set(t.id, {
      team_id: t.id,
      team_name: t.name,
      team_slug: t.slug,
      logo_url: t.logo_url,
      total_points: 0,
      event_count: 0,
    });
  }
  for (const e of MOCK_EVENTS) {
    const row = byTeam.get(e.team_id);
    if (!row) continue;
    row.total_points += e.points;
    row.event_count += 1;
  }
  return [...byTeam.values()]
    .filter((r) => r.event_count > 0)
    .sort((a, b) => b.total_points - a.total_points || a.team_name.localeCompare(b.team_name));
}

export function mockCategoryBreakdown(): CategoryBreakdown[] {
  const byCategory = new Map<string, CategoryBreakdown>();
  for (const c of mockCategories) {
    byCategory.set(c.type, { category: c.type, label: c.label, emoji: c.emoji, points: 0 });
  }
  for (const e of MOCK_EVENTS) {
    const action = mockActions.find((a) => a.type === e.action_type);
    if (!action) continue;
    const bucket = byCategory.get(action.category);
    if (bucket) bucket.points += e.points;
  }
  return [...byCategory.values()].filter((b) => b.points > 0);
}

export function mockFeed(limit = 20): FeedEntry[] {
  return MOCK_EVENTS.slice(0, limit).map((e) => {
    const team = TEAMS.find((t) => t.id === e.team_id)!;
    const action = mockActions.find((a) => a.type === e.action_type);
    return {
      event_id: e.id,
      team_id: e.team_id,
      team_name: team.name,
      team_slug: team.slug,
      logo_url: team.logo_url,
      action_type: e.action_type,
      action_label: action?.label ?? e.action_type,
      category: action?.category ?? 'unknown',
      points: e.points,
      description: null,
      creator_name: e.creator_name,
      created_at: e.created_at,
    };
  });
}
