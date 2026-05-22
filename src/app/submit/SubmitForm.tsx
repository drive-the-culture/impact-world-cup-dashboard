'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { calculatePoints } from '@/lib/scoring';
import type { Action, Category, MultiplierEvent, Team, ViewTier } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { submitImpact, type SubmitFormState } from './actions';

type Props = {
  teams: Team[];
  categories: Category[];
  actions: Action[];
  viewTiers: ViewTier[];
  multiplierEvents: MultiplierEvent[];
  turnstileSiteKey: string;
};

const INITIAL: SubmitFormState = { status: 'idle' };

export function SubmitForm({
  teams,
  categories,
  actions,
  viewTiers,
  multiplierEvents,
  turnstileSiteKey,
}: Props) {
  const [state, formAction] = useActionState(submitImpact, INITIAL);
  const [pending, startTransition] = useTransition();

  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [creatorName, setCreatorName] = useState('');
  const [actionType, setActionType] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [bonusFlags, setBonusFlags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');

  const primaryActions = useMemo(
    () => actions.filter((a) => !a.is_bonus && !a.is_subjective),
    [actions],
  );
  const bonusOptions = useMemo(() => actions.filter((a) => a.is_bonus), [actions]);

  const grouped = useMemo(
    () =>
      categories.map((cat) => ({
        category: cat,
        items: primaryActions.filter((a) => a.category === cat.type),
      })),
    [categories, primaryActions],
  );

  const selectedAction = actions.find((a) => a.type === actionType);

  const breakdown = useMemo(() => {
    if (!actionType) {
      return calculatePoints(
        { action_type: '', metric_value: null, bonus_flags: [] },
        { actions, viewTiers, multiplierEvents },
      );
    }
    return calculatePoints(
      {
        action_type: actionType,
        metric_value: metricValue ? Number(metricValue) : null,
        bonus_flags: bonusFlags,
      },
      { actions, viewTiers, multiplierEvents },
    );
  }, [actionType, metricValue, bonusFlags, actions, viewTiers, multiplierEvents]);

  function toggleBonus(type: string, checked: boolean) {
    setBonusFlags((prev) =>
      checked ? [...new Set([...prev, type])] : prev.filter((b) => b !== type),
    );
  }

  async function handleScreenshotUpload(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${teamId || 'unknown'}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('submission-screenshots')
        .upload(path, file, { cacheControl: '3600' });
      if (error) throw error;
      const { data } = supabase.storage
        .from('submission-screenshots')
        .getPublicUrl(path);
      setScreenshotUrl(data.publicUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set('screenshot_url', screenshotUrl);
    data.set('cf_turnstile_token', turnstileToken);
    startTransition(() => formAction(data));
  }

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-8 text-center">
        <h2 className="text-xl font-semibold text-white">Thanks — submission queued.</h2>
        <p className="mt-2 text-sm text-white/70">
          A reviewer will check it shortly. Estimated points if approved:{' '}
          <span className="font-mono font-bold text-amber-300">
            {state.computedPoints.toLocaleString()}
          </span>
          .
        </p>
        <p className="mt-4 text-xs text-white/40">
          Submitting again? Reload this page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Team" required>
        <select
          name="team_id"
          required
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className={inputCls}
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Creator name" hint="Optional. Your name on the leaderboard.">
        <input
          type="text"
          name="creator_name"
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
          placeholder="e.g. Jasmine R."
          className={inputCls}
        />
      </Field>

      <Field label="What did you do?" required>
        <select
          name="action_type"
          required
          value={actionType}
          onChange={(e) => {
            setActionType(e.target.value);
            setMetricValue('');
          }}
          className={inputCls}
        >
          <option value="" disabled>
            Pick an action…
          </option>
          {grouped.map(
            ({ category, items }) =>
              items.length > 0 && (
                <optgroup key={category.type} label={`${category.emoji} ${category.label}`}>
                  {items.map((a) => (
                    <option key={a.type} value={a.type}>
                      {a.label}{' '}
                      {a.metric_kind === 'per_unit' && a.per_unit_points
                        ? `(+${a.per_unit_points} / ${a.metric_label})`
                        : a.metric_kind === 'views'
                          ? `(${a.base_points} pts + views)`
                          : `(${a.base_points} pts)`}
                    </option>
                  ))}
                </optgroup>
              ),
          )}
        </select>
      </Field>

      {selectedAction?.metric_kind === 'views' && (
        <Field
          label={selectedAction.metric_label ?? 'Total views'}
          hint="Enter the current view count on the post. Higher tiers earn more."
        >
          <input
            type="number"
            inputMode="numeric"
            min={0}
            name="metric_value"
            value={metricValue}
            onChange={(e) => setMetricValue(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
      )}

      {selectedAction?.metric_kind === 'per_unit' && (
        <Field
          label={selectedAction.metric_label ?? 'Count'}
          hint={`Each unit is worth +${selectedAction.per_unit_points ?? 0} pts.`}
        >
          <input
            type="number"
            inputMode="numeric"
            min={0}
            name="metric_value"
            value={metricValue}
            onChange={(e) => setMetricValue(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
      )}

      {bonusOptions.length > 0 && (
        <Field
          label="Speed of Impact bonuses"
          hint="Check any that apply. Bonuses stack on top of the base action."
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {bonusOptions.map((b) => {
            const checked = bonusFlags.includes(b.type);
            return (
              <label
                key={b.type}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  checked
                    ? 'border-amber-400/60 bg-amber-400/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                }`}
              >
                <input
                  type="checkbox"
                  name="bonus_flags"
                  value={b.type}
                  checked={checked}
                  onChange={(e) => toggleBonus(b.type, e.target.checked)}
                  className="accent-amber-400"
                />
                <span className="flex-1">{b.label}</span>
                <span className="font-mono text-xs text-amber-300">+{b.base_points}</span>
              </label>
            );
          })}
          </div>
        </Field>
      )}

      <Field label="Post URL" hint="Link to the Instagram, TikTok, YouTube, etc. post.">
        <input
          type="url"
          name="post_url"
          value={postUrl}
          onChange={(e) => setPostUrl(e.target.value)}
          placeholder="https://..."
          className={inputCls}
        />
      </Field>

      <Field label="Description" hint="What was it? Who was featured? Optional.">
        <textarea
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Recap of the McNair Park volunteer day…"
          className={inputCls}
        />
      </Field>

      <Field label="Screenshot" hint="Optional proof. JPEG, PNG, or WebP. Max 5 MB.">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f) handleScreenshotUpload(f);
          }}
          className="block w-full text-sm text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
        />
        {uploading && <p className="mt-1 text-xs text-white/50">Uploading…</p>}
        {uploadError && (
          <p className="mt-1 text-xs text-red-300">{uploadError}</p>
        )}
        {screenshotUrl && !uploading && (
          <p className="mt-1 text-xs text-emerald-300">
            Uploaded.{' '}
            <a href={screenshotUrl} target="_blank" rel="noreferrer" className="underline">
              View
            </a>
          </p>
        )}
      </Field>

      <Field label="Your email" hint="Optional. Lets a reviewer follow up.">
        <input
          type="email"
          name="submitter_email"
          value={submitterEmail}
          onChange={(e) => setSubmitterEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputCls}
        />
      </Field>

      <ScorePreview action={selectedAction} breakdown={breakdown} />

      <div className="flex justify-center pt-2">
        <Turnstile
          siteKey={turnstileSiteKey}
          onSuccess={setTurnstileToken}
          options={{ theme: 'dark' }}
        />
      </div>

      {state.status === 'error' && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !actionType || !teamId}
        className="w-full rounded-lg bg-amber-400 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Submitting…' : `Submit for review${breakdown.total ? ` (${breakdown.total.toLocaleString()} pts est.)` : ''}`}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/90">
        {label}
        {required && <span className="ml-1 text-amber-400">*</span>}
      </span>
      {hint && <span className="ml-2 text-xs text-white/40">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function ScorePreview({
  action,
  breakdown,
}: {
  action: Action | undefined;
  breakdown: ReturnType<typeof calculatePoints>;
}) {
  if (!action) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-center text-xs text-white/40">
        Pick an action above to see your estimated impact points.
      </div>
    );
  }

  const lines: { label: string; points: number }[] = [
    { label: action.label, points: breakdown.base },
  ];
  if (breakdown.view_tier > 0) {
    lines.push({
      label: `View tier (${breakdown.applied_view_tier_label})`,
      points: breakdown.view_tier,
    });
  }
  if (breakdown.per_unit > 0) {
    lines.push({ label: action.metric_label ?? 'Per-unit total', points: breakdown.per_unit });
  }
  for (const b of breakdown.applied_bonuses ?? []) {
    lines.push({ label: b.label, points: b.points });
  }

  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
      <div className="text-xs uppercase tracking-widest text-amber-300/80">Estimated points</div>
      <ul className="mt-2 space-y-1 text-sm">
        {lines.map((l, i) => (
          <li key={i} className="flex justify-between text-white/80">
            <span>{l.label}</span>
            <span className="font-mono text-white">+{l.points.toLocaleString()}</span>
          </li>
        ))}
        {breakdown.multiplier !== 1 && (
          <li className="flex justify-between text-amber-200">
            <span>Double XP active</span>
            <span className="font-mono">×{breakdown.multiplier}</span>
          </li>
        )}
      </ul>
      <div className="mt-3 flex items-baseline justify-between border-t border-amber-400/20 pt-3">
        <span className="text-sm font-medium text-white">Total</span>
        <span className="font-mono text-2xl font-bold text-amber-300">
          {breakdown.total.toLocaleString()}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-white/40">
        Estimate. Final value is set on admin approval — they can adjust if metrics are off.
      </p>
    </div>
  );
}

const inputCls =
  'block w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/30';
