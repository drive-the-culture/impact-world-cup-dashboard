import Link from 'next/link';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { PointsDonut } from '@/components/dashboard/PointsDonut';
import { ImpactFeed } from '@/components/dashboard/ImpactFeed';
import { RealtimeProvider } from '@/components/dashboard/RealtimeProvider';
import { getCategoryBreakdown } from '@/lib/queries';
import { isUsingPlaceholderSupabase } from '@/lib/fixtures';

export const dynamic = 'force-dynamic'; // Realtime push handles freshness; skip prerender.

export default async function DashboardPage() {
  const breakdown = await getCategoryBreakdown();
  const isDemo = isUsingPlaceholderSupabase();

  return (
    <RealtimeProvider>
      <main className="mx-auto max-w-7xl px-6 py-10">
        {isDemo && (
          <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-100">
            <strong className="font-semibold">Demo data.</strong> Connect a
            Supabase project (see <code className="rounded bg-black/30 px-1 text-xs">supabase/README.md</code>) to switch to live.
          </div>
        )}

        <section className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
            The scoreboard is live
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">
            30 Teams. One City. Real Impact.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
            Creators earn{' '}
            <span className="font-semibold text-amber-300">Impact Points™</span>{' '}
            for content, community work, hidden gems, and live activations.
          </p>
          <div className="mt-5">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Log impact
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Leaderboard />
          </div>
          <div className="space-y-6">
            <PointsDonut data={breakdown} />
            <ImpactFeed />
          </div>
        </section>
      </main>
    </RealtimeProvider>
  );
}
