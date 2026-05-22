// Database types — hand-maintained against /supabase/migrations.
// Update both when the schema changes.

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type MetricKind = 'none' | 'views' | 'per_unit';

export type Category = {
  type: string;
  label: string;
  emoji: string | null;
  sort_order: number;
};

export type Action = {
  type: string;
  category: string;
  label: string;
  base_points: number;
  per_unit_points: number | null;
  metric_kind: MetricKind;
  metric_label: string | null;
  is_bonus: boolean;
  is_subjective: boolean;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
};

export type ViewTier = {
  id: number;
  label: string;
  min_views: number;
  points: number;
};

export type MultiplierEvent = {
  id: string;
  label: string;
  multiplier: number;
  starts_at: string;
  ends_at: string;
  created_by: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
};

export type PointsBreakdown = {
  base: number;
  view_tier: number;
  per_unit: number;
  speed_bonuses: number;
  multiplier: number;
  subtotal: number;
  total: number;
  // Per-line trace for the admin UI.
  applied_view_tier_label?: string | null;
  applied_bonuses?: { type: string; label: string; points: number }[];
};

export type Submission = {
  id: string;
  team_id: string;
  creator_name: string | null;
  action_type: string;
  post_url: string | null;
  metric_value: number | null;
  bonus_flags: string[];
  description: string | null;
  screenshot_url: string | null;
  submitter_email: string | null;

  submitted_action_type: string;
  submitted_metric_value: number | null;
  submitted_bonus_flags: string[];
  computed_points: number;

  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;

  created_at: string;
};

export type ImpactEvent = {
  id: string;
  team_id: string;
  creator_name: string | null;
  action_type: string;
  points: number;
  points_breakdown: PointsBreakdown;
  source_submission_id: string;

  created_by: string | null;
  created_at: string;

  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
};

export type Admin = {
  email: string;
  added_at: string;
  added_by: string | null;
};

// Derived/joined shapes used in the dashboard.

export type LeaderboardRow = {
  team_id: string;
  team_name: string;
  team_slug: string;
  logo_url: string | null;
  total_points: number;
  event_count: number;
};

export type FeedEntry = {
  event_id: string;
  team_id: string;
  team_name: string;
  team_slug: string;
  logo_url: string | null;
  action_type: string;
  action_label: string;
  category: string;
  points: number;
  description: string | null;
  creator_name: string | null;
  created_at: string;
};

export type CategoryBreakdown = {
  category: string;
  label: string;
  emoji: string | null;
  points: number;
};
