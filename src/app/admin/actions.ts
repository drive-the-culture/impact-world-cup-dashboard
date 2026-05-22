'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { calculatePoints } from '@/lib/scoring';
import { isUsingPlaceholderSupabase } from '@/lib/fixtures';
import type { Action, MultiplierEvent, ViewTier } from '@/lib/types';

// Verify the current session belongs to an admin. Service-role client
// reads the admins allowlist (RLS blocks anon reads on this table).
async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated.');

  const svc = createServiceClient();
  const { data } = await svc.from('admins').select('email').eq('email', user.email).maybeSingle();
  if (!data) throw new Error('Not authorized.');
  return { userId: user.id, email: user.email };
}

async function loadScoringContext(svc: ReturnType<typeof createServiceClient>) {
  const nowIso = new Date().toISOString();
  const [actionsRes, tiersRes, mulRes] = await Promise.all([
    svc.from('actions').select('*').eq('is_active', true),
    svc.from('view_tiers').select('*'),
    svc.from('multiplier_events').select('*').lte('starts_at', nowIso).gte('ends_at', nowIso),
  ]);
  return {
    actions: (actionsRes.data ?? []) as Action[],
    viewTiers: (tiersRes.data ?? []) as ViewTier[],
    multiplierEvents: (mulRes.data ?? []) as MultiplierEvent[],
  };
}

export type ActionResult = { ok: true } | { ok: false; message: string };

// Approve a pending submission. Optionally apply admin overrides
// (action_type, metric_value, bonus_flags) before computing final points.
// On success: writes an impact_event with the computed points + breakdown,
// updates the submission status, and bumps the dashboard.
export async function approveSubmission(
  submissionId: string,
  overrides?: {
    action_type?: string;
    metric_value?: number | null;
    bonus_flags?: string[];
  },
): Promise<ActionResult> {
  if (isUsingPlaceholderSupabase()) {
    return { ok: false, message: 'Connect Supabase first — no DB to write to.' };
  }

  try {
    const { userId } = await requireAdmin();
    const svc = createServiceClient();

    const { data: subRow, error: subErr } = await svc
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('status', 'pending')
      .maybeSingle();
    if (subErr) throw subErr;
    if (!subRow) return { ok: false, message: 'Submission not found or already reviewed.' };

    const finalActionType = overrides?.action_type ?? subRow.action_type;
    const finalMetricValue =
      overrides?.metric_value !== undefined ? overrides.metric_value : subRow.metric_value;
    const finalBonusFlags = overrides?.bonus_flags ?? subRow.bonus_flags;

    const { actions, viewTiers, multiplierEvents } = await loadScoringContext(svc);
    const action = actions.find((a) => a.type === finalActionType);
    if (!action) return { ok: false, message: 'Unknown action.' };

    const breakdown = calculatePoints(
      {
        action_type: finalActionType,
        metric_value: finalMetricValue,
        bonus_flags: finalBonusFlags,
      },
      { actions, viewTiers, multiplierEvents },
    );

    // Persist the override back to the submission so the audit trail shows
    // what was approved, not just what was submitted.
    const { error: updErr } = await svc
      .from('submissions')
      .update({
        action_type: finalActionType,
        metric_value: finalMetricValue,
        bonus_flags: finalBonusFlags,
        computed_points: breakdown.total,
        status: 'approved',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);
    if (updErr) throw updErr;

    const { error: insErr } = await svc.from('impact_events').insert({
      team_id: subRow.team_id,
      creator_name: subRow.creator_name,
      action_type: finalActionType,
      points: breakdown.total,
      points_breakdown: breakdown,
      source_submission_id: submissionId,
      created_by: userId,
    });
    if (insErr) throw insErr;

    revalidatePath('/');
    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Unknown error.' };
  }
}

export async function rejectSubmission(
  submissionId: string,
  reason: string,
): Promise<ActionResult> {
  if (isUsingPlaceholderSupabase()) {
    return { ok: false, message: 'Connect Supabase first — no DB to write to.' };
  }

  try {
    const { userId } = await requireAdmin();
    const svc = createServiceClient();
    const { error } = await svc
      .from('submissions')
      .update({
        status: 'rejected',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason || null,
      })
      .eq('id', submissionId)
      .eq('status', 'pending');
    if (error) throw error;

    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Unknown error.' };
  }
}

// Soft-delete an approved impact_event. Reverts the source submission
// back to 'pending' so it can be re-reviewed.
export async function undoApproval(
  impactEventId: string,
  reason: string,
): Promise<ActionResult> {
  if (isUsingPlaceholderSupabase()) {
    return { ok: false, message: 'Connect Supabase first — no DB to write to.' };
  }

  try {
    const { userId } = await requireAdmin();
    const svc = createServiceClient();

    const { data: ev, error: evErr } = await svc
      .from('impact_events')
      .select('source_submission_id')
      .eq('id', impactEventId)
      .is('deleted_at', null)
      .maybeSingle();
    if (evErr) throw evErr;
    if (!ev) return { ok: false, message: 'Impact event not found.' };

    const { error: delErr } = await svc
      .from('impact_events')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deletion_reason: reason || 'Reverted by admin',
      })
      .eq('id', impactEventId);
    if (delErr) throw delErr;

    // Put the submission back in the queue. Admin can edit + re-approve.
    const { error: subErr } = await svc
      .from('submissions')
      .update({ status: 'pending', reviewed_by: null, reviewed_at: null })
      .eq('id', ev.source_submission_id);
    if (subErr) throw subErr;

    revalidatePath('/');
    revalidatePath('/admin');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Unknown error.' };
  }
}
