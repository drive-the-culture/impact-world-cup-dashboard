// Lightweight relative-time formatter. Avoids pulling in date-fns/dayjs.
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const s = Math.round(diff / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(then).toLocaleDateString();
}

export function formatPoints(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}

// Brand palette for the 8 rubric categories — used in the donut + chips.
export const CATEGORY_COLORS: Record<string, string> = {
  content_creation:    '#f4b82e', // gold
  engagement:          '#ef4444', // red
  hidden_gems:         '#06b6d4', // cyan
  community_impact:    '#10b981', // emerald
  speed_of_impact:     '#f97316', // orange
  team_support:        '#a855f7', // purple
  culture_creativity:  '#ec4899', // pink
  tourism_impact:      '#3b82f6', // blue
};

export function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? '#9ca3af';
}
