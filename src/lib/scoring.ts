import type { Action, MultiplierEvent, PointsBreakdown, ViewTier } from './types';

// Deterministic scoring. Same function runs:
//   • client-side on the /submit form for the live preview
//   • client-side in the admin queue when the reviewer tweaks fields
//   • server-side on approval to persist the final number
// Encodes the rubric in supabase/SCORING_RUBRIC.md.

export type ScoringInput = {
  action_type: string;
  metric_value: number | null;
  bonus_flags: string[];
  // Approval time — used to pick which multiplier_event (if any) applies.
  // Pass null on the form (live preview); pass a timestamp on approval.
  at?: Date | null;
};

export type ScoringContext = {
  actions: Action[];
  viewTiers: ViewTier[];
  multiplierEvents: MultiplierEvent[];
};

const EMPTY_BREAKDOWN: PointsBreakdown = {
  base: 0,
  view_tier: 0,
  per_unit: 0,
  speed_bonuses: 0,
  multiplier: 1,
  subtotal: 0,
  total: 0,
  applied_view_tier_label: null,
  applied_bonuses: [],
};

export function calculatePoints(
  input: ScoringInput,
  ctx: ScoringContext,
): PointsBreakdown {
  const action = ctx.actions.find((a) => a.type === input.action_type);
  if (!action) return EMPTY_BREAKDOWN;

  // Base points for the primary action.
  const base = action.base_points;

  // Metric-dependent additions.
  let viewTierPoints = 0;
  let viewTierLabel: string | null = null;
  let perUnitPoints = 0;

  const v = Number(input.metric_value);
  if (Number.isFinite(v) && v > 0) {
    if (action.metric_kind === 'views') {
      const tier = highestViewTier(v, ctx.viewTiers);
      if (tier) {
        viewTierPoints = tier.points;
        viewTierLabel = tier.label;
      }
    } else if (action.metric_kind === 'per_unit' && action.per_unit_points) {
      perUnitPoints = Math.round(v * Number(action.per_unit_points));
    }
  }

  // Speed-of-Impact / engagement-quality bonuses. Only bonus actions in the
  // same is_bonus=true set are valid; unknown flags are silently dropped.
  const appliedBonuses: { type: string; label: string; points: number }[] = [];
  let speedBonuses = 0;
  for (const flag of input.bonus_flags ?? []) {
    const bonus = ctx.actions.find((a) => a.type === flag && a.is_bonus);
    if (!bonus) continue;
    speedBonuses += bonus.base_points;
    appliedBonuses.push({
      type: bonus.type,
      label: bonus.label,
      points: bonus.base_points,
    });
  }

  const subtotal = base + viewTierPoints + perUnitPoints + speedBonuses;

  // Active multiplier (Double XP day, etc). Highest wins if multiple overlap.
  const at = input.at ?? new Date();
  const multiplier = activeMultiplier(at, ctx.multiplierEvents);

  const total = Math.round(subtotal * multiplier);

  return {
    base,
    view_tier: viewTierPoints,
    per_unit: perUnitPoints,
    speed_bonuses: speedBonuses,
    multiplier,
    subtotal,
    total,
    applied_view_tier_label: viewTierLabel,
    applied_bonuses: appliedBonuses,
  };
}

function highestViewTier(views: number, tiers: ViewTier[]): ViewTier | undefined {
  return tiers
    .filter((t) => views >= t.min_views)
    .sort((a, b) => b.min_views - a.min_views)[0];
}

function activeMultiplier(at: Date, events: MultiplierEvent[]): number {
  const t = at.getTime();
  const active = events.filter(
    (e) => new Date(e.starts_at).getTime() <= t && new Date(e.ends_at).getTime() >= t,
  );
  if (active.length === 0) return 1;
  return Math.max(...active.map((e) => Number(e.multiplier)));
}
