import type { ScoringRule } from './types';

// Pure function: given a category type and a submitted value, return the
// integer points awarded. Used in the admin review preview AND server-side
// on approval — same math, same source of truth, no drift.
//
// Rounded to the nearest integer because dashboards display whole numbers.
export function calculatePoints(
  type: string,
  value: number,
  rules: ScoringRule[],
): number {
  const rule = rules.find((r) => r.type === type);
  if (!rule) return 0;
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * Number(rule.points_per_unit));
}

export function findRule(type: string, rules: ScoringRule[]): ScoringRule | undefined {
  return rules.find((r) => r.type === type);
}
