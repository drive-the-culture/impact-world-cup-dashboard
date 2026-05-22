import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Action, Category } from '@/lib/types';

export default async function ScoringRulesPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: actions }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .returns<Category[]>(),
    supabase
      .from('actions')
      .select('*')
      .order('sort_order', { ascending: true })
      .returns<Action[]>(),
  ]);

  const grouped = (categories ?? []).map((cat) => ({
    category: cat,
    actions: (actions ?? []).filter((a) => a.category === cat.type),
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Scoring rules</h1>
      </div>

      <nav className="mt-6 flex gap-2 text-sm">
        <Link
          href="/admin"
          className="rounded-lg px-3 py-2 text-white/70 hover:bg-white/5"
        >
          Review queue
        </Link>
        <Link
          href="/admin/scoring"
          className="rounded-lg bg-white/10 px-3 py-2 text-white"
        >
          Scoring rules
        </Link>
      </nav>

      <p className="mt-6 text-sm text-white/60">
        Action values from{' '}
        <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">
          supabase/SCORING_RUBRIC.md
        </code>
        . Inline editing ships post-May-28 — for now, tune values via SQL.
      </p>

      <div className="mt-6 space-y-8">
        {grouped.map(({ category, actions: catActions }) => (
          <section
            key={category.type}
            className="overflow-hidden rounded-2xl border border-white/10"
          >
            <header className="flex items-center gap-2 bg-white/[0.04] px-5 py-3">
              <span className="text-xl">{category.emoji}</span>
              <h2 className="text-base font-semibold text-white">
                {category.label}
              </h2>
              <span className="ml-auto text-xs text-white/40">
                {catActions.length} action{catActions.length === 1 ? '' : 's'}
              </span>
            </header>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-5 py-2">Action</th>
                  <th className="px-5 py-2">Type</th>
                  <th className="px-5 py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {catActions.map((a) => (
                  <tr key={a.type}>
                    <td className="px-5 py-2.5">
                      <div className="font-medium">{a.label}</div>
                      {!a.is_active && (
                        <div className="text-xs text-amber-300/80">
                          deferred — needs tracking mechanism
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-white/60">
                      {a.is_bonus
                        ? 'Bonus (stacks)'
                        : a.is_subjective
                          ? 'Subjective award'
                          : a.metric_kind === 'views'
                            ? `Fixed + view tier`
                            : a.metric_kind === 'per_unit'
                              ? `Per ${a.metric_label ?? 'unit'}`
                              : 'Fixed'}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono">
                      {a.metric_kind === 'per_unit' && a.per_unit_points
                        ? `+${a.per_unit_points}/unit`
                        : a.is_bonus
                          ? `+${a.base_points}`
                          : a.base_points}
                    </td>
                  </tr>
                ))}
                {catActions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-white/40">
                      No actions seeded for this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </main>
  );
}
