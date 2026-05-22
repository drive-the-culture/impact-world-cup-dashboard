import { createClient } from './supabase/server';
import type {
  Action,
  Category,
  CategoryBreakdown,
  FeedEntry,
  ImpactEvent,
  LeaderboardRow,
  MultiplierEvent,
  Submission,
  Team,
  ViewTier,
} from './types';
import {
  isUsingPlaceholderSupabase,
  mockActions,
  mockCategories,
  mockCategoryBreakdown,
  mockFeed,
  mockLeaderboard,
  mockPendingSubmissions,
  mockRecentApprovals,
  mockTeams,
  mockViewTiers,
} from './fixtures';

// Data layer for the public dashboard. Uses Supabase when configured,
// falls back to mock fixtures when NEXT_PUBLIC_SUPABASE_URL is the
// placeholder. Same return shapes either way — components don't care.

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  if (isUsingPlaceholderSupabase()) return mockLeaderboard();

  const supabase = await createClient();
  const [teamsRes, eventsRes] = await Promise.all([
    supabase.from('teams').select('id, name, slug, logo_url'),
    supabase
      .from('impact_events')
      .select('team_id, points')
      .is('deleted_at', null),
  ]);

  const teams = teamsRes.data ?? [];
  const events = eventsRes.data ?? [];

  const map = new Map<string, LeaderboardRow>();
  for (const t of teams) {
    map.set(t.id, {
      team_id: t.id,
      team_name: t.name,
      team_slug: t.slug,
      logo_url: t.logo_url,
      total_points: 0,
      event_count: 0,
    });
  }
  for (const e of events) {
    const row = map.get(e.team_id);
    if (!row) continue;
    row.total_points += Number(e.points);
    row.event_count += 1;
  }
  return [...map.values()]
    .filter((r) => r.event_count > 0)
    .sort(
      (a, b) =>
        b.total_points - a.total_points || a.team_name.localeCompare(b.team_name),
    );
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  if (isUsingPlaceholderSupabase()) return mockCategoryBreakdown();

  const supabase = await createClient();
  const [catsRes, eventsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('type, label, emoji, sort_order')
      .order('sort_order'),
    supabase
      .from('impact_events')
      .select('points, action:actions(category)')
      .is('deleted_at', null),
  ]);

  const cats = catsRes.data ?? [];
  type Joined = { points: number; action: { category: string } | null };
  const events = (eventsRes.data ?? []) as unknown as Joined[];

  const map = new Map<string, CategoryBreakdown>();
  for (const c of cats) {
    map.set(c.type, { category: c.type, label: c.label, emoji: c.emoji, points: 0 });
  }
  for (const e of events) {
    const cat = e.action?.category;
    if (!cat) continue;
    const row = map.get(cat);
    if (row) row.points += Number(e.points);
  }
  return [...map.values()].filter((b) => b.points > 0);
}

// Form data — teams + categories + actions + view tiers + active multipliers.
// One round-trip when the form mounts.
export type FormBootstrap = {
  teams: Team[];
  categories: Category[];
  actions: Action[];
  viewTiers: ViewTier[];
  multiplierEvents: MultiplierEvent[];
};

export async function getFormBootstrap(): Promise<FormBootstrap> {
  if (isUsingPlaceholderSupabase()) {
    return {
      teams: mockTeams,
      categories: mockCategories,
      actions: mockActions,
      viewTiers: mockViewTiers,
      multiplierEvents: [],
    };
  }

  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const [teamsRes, catsRes, actionsRes, tiersRes, mulRes] = await Promise.all([
    supabase.from('teams').select('*').order('name'),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('actions').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('view_tiers').select('*').order('min_views'),
    supabase
      .from('multiplier_events')
      .select('*')
      .lte('starts_at', nowIso)
      .gte('ends_at', nowIso),
  ]);

  return {
    teams: (teamsRes.data ?? []) as Team[],
    categories: (catsRes.data ?? []) as Category[],
    actions: (actionsRes.data ?? []) as Action[],
    viewTiers: (tiersRes.data ?? []) as ViewTier[],
    multiplierEvents: (mulRes.data ?? []) as MultiplierEvent[],
  };
}

// Admin review queue: pending submissions joined with their team.
export type PendingSubmissionRow = Submission & {
  team: { id: string; name: string; slug: string } | null;
};

export async function getPendingSubmissions(): Promise<PendingSubmissionRow[]> {
  if (isUsingPlaceholderSupabase()) return mockPendingSubmissions();

  const supabase = await createClient();
  const { data } = await supabase
    .from('submissions')
    .select('*, team:teams(id, name, slug)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return (data ?? []) as unknown as PendingSubmissionRow[];
}

// Recently approved impact_events with team + action — for the undo strip.
export type RecentApprovalRow = ImpactEvent & {
  team: { name: string; slug: string } | null;
  action: { label: string; category: string } | null;
};

export async function getRecentApprovals(limit = 8): Promise<RecentApprovalRow[]> {
  if (isUsingPlaceholderSupabase()) return mockRecentApprovals(limit);

  const supabase = await createClient();
  const { data } = await supabase
    .from('impact_events')
    .select('*, team:teams(name, slug), action:actions(label, category)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as RecentApprovalRow[];
}

export async function getRecentFeed(limit = 20): Promise<FeedEntry[]> {
  if (isUsingPlaceholderSupabase()) return mockFeed(limit);

  const supabase = await createClient();
  const { data } = await supabase
    .from('impact_events')
    .select(
      `id, team_id, creator_name, action_type, points, description, created_at,
       team:teams(name, slug, logo_url),
       action:actions(label, category)`,
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  type Joined = {
    id: string;
    team_id: string;
    creator_name: string | null;
    action_type: string;
    points: number;
    description: string | null;
    created_at: string;
    team: { name: string; slug: string; logo_url: string | null } | null;
    action: { label: string; category: string } | null;
  };

  return ((data ?? []) as unknown as Joined[]).map((e) => ({
    event_id: e.id,
    team_id: e.team_id,
    team_name: e.team?.name ?? 'Unknown',
    team_slug: e.team?.slug ?? '',
    logo_url: e.team?.logo_url ?? null,
    action_type: e.action_type,
    action_label: e.action?.label ?? e.action_type,
    category: e.action?.category ?? 'unknown',
    points: Number(e.points),
    description: e.description,
    creator_name: e.creator_name,
    created_at: e.created_at,
  }));
}
