'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { calculatePoints } from '@/lib/scoring';
import type {
  Action,
  Category,
  MultiplierEvent,
  Submission,
  Team,
  ViewTier,
} from '@/lib/types';
import type { PendingSubmissionRow, RecentApprovalRow } from '@/lib/queries';
import { categoryColor, formatPoints, timeAgo } from '@/lib/util/format';
import { approveSubmission, rejectSubmission, undoApproval } from './actions';

type Props = {
  pending: PendingSubmissionRow[];
  recent: RecentApprovalRow[];
  teams: Team[];
  categories: Category[];
  actions: Action[];
  viewTiers: ViewTier[];
  multiplierEvents: MultiplierEvent[];
};

export function ReviewQueue({
  pending,
  recent,
  categories,
  actions,
  viewTiers,
  multiplierEvents,
}: Props) {
  return (
    <div className="space-y-8">
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">Pending review</h2>
          <span className="text-xs uppercase tracking-widest text-white/40">
            {pending.length} waiting
          </span>
        </header>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center text-sm text-white/40">
            All caught up. Nothing to review.
          </div>
        ) : (
          <ul className="space-y-3">
            {pending.map((sub) => (
              <ReviewCard
                key={sub.id}
                submission={sub}
                categories={categories}
                actions={actions}
                viewTiers={viewTiers}
                multiplierEvents={multiplierEvents}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">Recently approved</h2>
          <span className="text-xs uppercase tracking-widest text-white/40">
            undo within reason
          </span>
        </header>

        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/40">
            Nothing approved yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((ev) => (
              <RecentRow key={ev.id} event={ev} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type CardProps = {
  submission: PendingSubmissionRow;
  categories: Category[];
  actions: Action[];
  viewTiers: ViewTier[];
  multiplierEvents: MultiplierEvent[];
};

function ReviewCard({ submission, categories, actions, viewTiers, multiplierEvents }: CardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [actionType, setActionType] = useState(submission.action_type);
  const [metricValue, setMetricValue] = useState(
    submission.metric_value === null ? '' : String(submission.metric_value),
  );
  const [bonusFlags, setBonusFlags] = useState<string[]>(submission.bonus_flags);

  const primaryActions = useMemo(
    () => actions.filter((a) => !a.is_bonus && !a.is_subjective),
    [actions],
  );
  const bonusOptions = useMemo(() => actions.filter((a) => a.is_bonus), [actions]);
  const grouped = useMemo(
    () =>
      categories.map((cat) => ({
        cat,
        items: primaryActions.filter((a) => a.category === cat.type),
      })),
    [categories, primaryActions],
  );

  const action = actions.find((a) => a.type === actionType);
  const breakdown = useMemo(
    () =>
      calculatePoints(
        {
          action_type: actionType,
          metric_value: metricValue ? Number(metricValue) : null,
          bonus_flags: bonusFlags,
        },
        { actions, viewTiers, multiplierEvents },
      ),
    [actionType, metricValue, bonusFlags, actions, viewTiers, multiplierEvents],
  );

  const wasEdited =
    actionType !== submission.action_type ||
    (metricValue ? Number(metricValue) : null) !== submission.metric_value ||
    JSON.stringify(bonusFlags.slice().sort()) !==
      JSON.stringify((submission.bonus_flags ?? []).slice().sort());

  function toggleBonus(type: string, checked: boolean) {
    setBonusFlags((prev) =>
      checked ? [...new Set([...prev, type])] : prev.filter((b) => b !== type),
    );
  }

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const overrides = wasEdited
        ? {
            action_type: actionType,
            metric_value: metricValue ? Number(metricValue) : null,
            bonus_flags: bonusFlags,
          }
        : undefined;
      const res = await approveSubmission(submission.id, overrides);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  }

  function handleReject() {
    const reason = window.prompt('Reason for rejection (optional, shown to submitter if email was provided):') ?? '';
    setError(null);
    startTransition(async () => {
      const res = await rejectSubmission(submission.id, reason);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-white">
            {submission.team?.name ?? 'Unknown team'}
          </span>
          {submission.creator_name && (
            <span className="text-sm text-white/50">· {submission.creator_name}</span>
          )}
        </div>
        <span className="text-xs text-white/40">
          submitted {timeAgo(submission.created_at)}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:items-start">
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                background: `${categoryColor(action?.category ?? '')}22`,
                color: categoryColor(action?.category ?? ''),
              }}
            >
              {action?.label ?? actionType}
            </span>
            {submission.bonus_flags.map((flag) => {
              const b = actions.find((a) => a.type === flag);
              return (
                <span
                  key={flag}
                  className="inline-block rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-200"
                >
                  ⚡ {b?.label ?? flag}
                </span>
              );
            })}
            {submission.metric_value !== null && (
              <span className="text-xs text-white/50">
                {Number(submission.metric_value).toLocaleString()}{' '}
                {action?.metric_label ?? 'units'}
              </span>
            )}
          </div>

          {submission.description && (
            <p className="text-white/70">{submission.description}</p>
          )}

          {submission.post_url && (
            <p>
              <a
                href={submission.post_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-300 underline decoration-amber-400/30 underline-offset-2 hover:decoration-amber-400/80"
              >
                {submission.post_url}
              </a>
            </p>
          )}

          {submission.screenshot_url && (
            <p>
              <a
                href={submission.screenshot_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white/50 underline hover:text-white"
              >
                View screenshot ↗
              </a>
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/40">
            {wasEdited ? 'Adjusted score' : 'Computed score'}
          </div>
          <div className="font-mono text-3xl font-bold text-amber-300">
            {formatPoints(breakdown.total)}
          </div>
          {wasEdited && (
            <div className="text-[11px] text-amber-200">
              was {formatPoints(submission.computed_points)}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="space-y-3 border-t border-white/5 bg-black/20 px-5 py-4">
          <label className="block text-xs text-white/60">
            Action
            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value);
                setMetricValue('');
              }}
              className="mt-1 block w-full rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
            >
              {grouped.map(
                ({ cat, items }) =>
                  items.length > 0 && (
                    <optgroup key={cat.type} label={`${cat.emoji} ${cat.label}`}>
                      {items.map((a) => (
                        <option key={a.type} value={a.type}>
                          {a.label}
                        </option>
                      ))}
                    </optgroup>
                  ),
              )}
            </select>
          </label>

          {action?.metric_kind === 'views' && (
            <label className="block text-xs text-white/60">
              Views
              <input
                type="number"
                min={0}
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                className="mt-1 block w-full rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
              />
            </label>
          )}
          {action?.metric_kind === 'per_unit' && (
            <label className="block text-xs text-white/60">
              {action.metric_label ?? 'Count'}
              <input
                type="number"
                min={0}
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                className="mt-1 block w-full rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
              />
            </label>
          )}

          {bonusOptions.length > 0 && (
            <div>
              <div className="text-xs text-white/60">Speed of Impact bonuses</div>
              <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {bonusOptions.map((b) => (
                  <label
                    key={b.type}
                    className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/80"
                  >
                    <input
                      type="checkbox"
                      checked={bonusFlags.includes(b.type)}
                      onChange={(e) => toggleBonus(b.type, e.target.checked)}
                      className="accent-amber-400"
                    />
                    <span className="flex-1">{b.label}</span>
                    <span className="font-mono text-amber-300">+{b.base_points}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/5 bg-black/10 px-5 py-3">
        {error && <span className="mr-auto text-xs text-red-300">{error}</span>}
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
        >
          {editing ? 'Hide adjust' : 'Adjust'}
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={pending}
          className="rounded-md border border-red-400/30 bg-red-400/5 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-400/15 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending}
          className="rounded-md bg-amber-400 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
        >
          {pending ? 'Saving…' : wasEdited ? `Approve at ${formatPoints(breakdown.total)}` : 'Approve'}
        </button>
      </footer>
    </li>
  );
}

function RecentRow({ event }: { event: RecentApprovalRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function handleUndo() {
    const reason =
      window.prompt('Reason for undoing? (optional, kept on the audit trail):') ?? '';
    setErr(null);
    startTransition(async () => {
      const res = await undoApproval(event.id, reason);
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2">
      <div className="min-w-0 flex-1 text-sm">
        <div className="truncate text-white">
          {event.team?.name ?? 'Unknown'}
          {event.creator_name && (
            <span className="text-white/40"> · {event.creator_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className="rounded-full px-2 py-0.5"
            style={{
              background: `${categoryColor(event.action?.category ?? '')}22`,
              color: categoryColor(event.action?.category ?? ''),
            }}
          >
            {event.action?.label ?? event.action_type}
          </span>
          <span className="text-white/40">{timeAgo(event.created_at)}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-base font-semibold text-amber-300">
          +{formatPoints(event.points)}
        </div>
      </div>
      <button
        type="button"
        onClick={handleUndo}
        disabled={pending}
        className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
        title="Soft-delete this event and return the submission to the queue"
      >
        {pending ? '…' : 'Undo'}
      </button>
      {err && <span className="text-xs text-red-300">{err}</span>}
    </li>
  );
}
