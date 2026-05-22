import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { ScoringRule } from '@/lib/types';

export default async function ScoringRulesPage() {
  const supabase = await createClient();
  const { data: rules } = await supabase
    .from('scoring_rules')
    .select('*')
    .order('sort_order', { ascending: true })
    .returns<ScoringRule[]>();

  const allPlaceholder = (rules ?? []).every((r) => r.is_placeholder);

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

      {allPlaceholder && (
        <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          <strong className="font-semibold">Awaiting official rubric.</strong>{' '}
          These point values are placeholders until the project owner finalizes
          the scoring. Editing them now will affect any submission approved
          after the change.
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Points per unit</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white">
            {(rules ?? []).map((r) => (
              <tr key={r.type}>
                <td className="px-4 py-3 font-medium">{r.label}</td>
                <td className="px-4 py-3 text-white/70">{r.unit}</td>
                <td className="px-4 py-3 text-right">{r.points_per_unit}</td>
                <td className="px-4 py-3 text-right">
                  {r.is_placeholder ? (
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-200">
                      placeholder
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-200">
                      official
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {(rules ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-white/40"
                >
                  No scoring rules yet. Run the seed migration.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-white/40">
        Inline editing ships Day 6. For now, edit values via SQL.
      </p>
    </main>
  );
}
