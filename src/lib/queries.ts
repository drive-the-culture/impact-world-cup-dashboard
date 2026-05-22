import { createClient } from './supabase/server';
import type {
  CategoryBreakdown,
  FeedEntry,
  LeaderboardRow,
} from './types';
import {
  isUsingPlaceholderSupabase,
  mockCategoryBreakdown,
  mockFeed,
  mockLeaderboard,
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
