'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { isUsingPlaceholderSupabase } from '@/lib/fixtures';
import { calculatePoints } from '@/lib/scoring';
import type { Action, MultiplierEvent, ViewTier } from '@/lib/types';

export type SubmitFormState =
  | { status: 'idle' }
  | { status: 'success'; computedPoints: number }
  | { status: 'error'; message: string };

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(token: string, remoteIp: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;

  // Cloudflare's always-pass dev secret short-circuits in local/preview env.
  if (secret.startsWith('1x0000000')) return true;

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function submitImpact(
  _prev: SubmitFormState,
  formData: FormData,
): Promise<SubmitFormState> {
  const teamId = String(formData.get('team_id') ?? '');
  const creatorName = String(formData.get('creator_name') ?? '').trim() || null;
  const actionType = String(formData.get('action_type') ?? '');
  const postUrl = String(formData.get('post_url') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const screenshotUrl = String(formData.get('screenshot_url') ?? '').trim() || null;
  const submitterEmail = String(formData.get('submitter_email') ?? '').trim() || null;
  const turnstileToken = String(formData.get('cf_turnstile_token') ?? '');

  const metricRaw = String(formData.get('metric_value') ?? '').trim();
  const metricValue = metricRaw === '' ? null : Number(metricRaw);

  const bonusFlags = formData
    .getAll('bonus_flags')
    .map((v) => String(v))
    .filter(Boolean);

  // Basic validation. Server-side; client-side validation is for UX.
  if (!teamId) return { status: 'error', message: 'Pick a team.' };
  if (!actionType) return { status: 'error', message: 'Pick an action.' };
  if (metricValue !== null && (!Number.isFinite(metricValue) || metricValue < 0)) {
    return { status: 'error', message: 'Metric value must be a positive number.' };
  }

  if (isUsingPlaceholderSupabase()) {
    // No real DB yet — accept the submission optimistically so the form
    // UX can be exercised against fixtures.
    return { status: 'success', computedPoints: 0 };
  }

  // Verify Turnstile before doing any work.
  const ok = await verifyTurnstile(turnstileToken, null);
  if (!ok) {
    return { status: 'error', message: 'Spam check failed. Refresh and try again.' };
  }

  const supabase = createServiceClient();

  // Load scoring context server-side so the points written are authoritative
  // (the client's preview was a hint, not a source of truth).
  const nowIso = new Date().toISOString();
  const [actionsRes, tiersRes, mulRes] = await Promise.all([
    supabase.from('actions').select('*').eq('is_active', true),
    supabase.from('view_tiers').select('*'),
    supabase
      .from('multiplier_events')
      .select('*')
      .lte('starts_at', nowIso)
      .gte('ends_at', nowIso),
  ]);

  const actions = (actionsRes.data ?? []) as Action[];
  const viewTiers = (tiersRes.data ?? []) as ViewTier[];
  const multiplierEvents = (mulRes.data ?? []) as MultiplierEvent[];

  const action = actions.find((a) => a.type === actionType);
  if (!action) return { status: 'error', message: 'Unknown action.' };
  if (action.is_subjective) {
    return { status: 'error', message: 'That action is admin-only.' };
  }

  const breakdown = calculatePoints(
    { action_type: actionType, metric_value: metricValue, bonus_flags: bonusFlags },
    { actions, viewTiers, multiplierEvents },
  );

  const { error } = await supabase.from('submissions').insert({
    team_id: teamId,
    creator_name: creatorName,
    action_type: actionType,
    post_url: postUrl,
    metric_value: metricValue,
    bonus_flags: bonusFlags,
    description,
    screenshot_url: screenshotUrl,
    submitter_email: submitterEmail,
    submitted_action_type: actionType,
    submitted_metric_value: metricValue,
    submitted_bonus_flags: bonusFlags,
    computed_points: breakdown.total,
  });

  if (error) {
    return { status: 'error', message: `Could not save: ${error.message}` };
  }

  revalidatePath('/admin');
  return { status: 'success', computedPoints: breakdown.total };
}
