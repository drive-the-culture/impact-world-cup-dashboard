// Database types for the Impact World Cup dashboard.
// Hand-maintained against the SQL migrations in /supabase/migrations.
// If the schema changes, update both.

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export type ScoringRule = {
  type: string;
  label: string;
  unit: string;
  points_per_unit: number;
  sort_order: number;
  is_placeholder: boolean;
  updated_at: string;
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
};

export type Submission = {
  id: string;
  team_id: string;
  type: string;
  value: number;
  description: string | null;
  screenshot_url: string | null;
  submitter_email: string | null;

  submitted_value: number;
  submitted_type: string;

  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;

  created_at: string;
};

export type ImpactEvent = {
  id: string;
  team_id: string;
  type: string;
  points: number;
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
  volunteer_hours: number;
  event_count: number;
};

export type FeedEntry = {
  event_id: string;
  team_id: string;
  team_name: string;
  team_slug: string;
  logo_url: string | null;
  type: string;
  type_label: string;
  points: number;
  description: string | null;
  created_at: string;
};

export type PointsBreakdown = {
  type: string;
  label: string;
  points: number;
};
