import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  getFormBootstrap,
  getPendingSubmissions,
  getRecentApprovals,
} from '@/lib/queries';
import { ReviewQueue } from './ReviewQueue';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [bootstrap, pending, recent] = await Promise.all([
    getFormBootstrap(),
    getPendingSubmissions(),
    getRecentApprovals(8),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-white">Admin</h1>
        <div className="text-sm text-white/60">
          Signed in as <span className="text-white">{user?.email ?? '—'}</span>
        </div>
      </div>

      <nav className="mt-6 flex gap-2 text-sm">
        <Link href="/admin" className="rounded-lg bg-white/10 px-3 py-2 text-white">
          Review queue
        </Link>
        <Link
          href="/admin/scoring"
          className="rounded-lg px-3 py-2 text-white/70 hover:bg-white/5"
        >
          Scoring rules
        </Link>
      </nav>

      <div className="mt-8">
        <ReviewQueue
          pending={pending}
          recent={recent}
          teams={bootstrap.teams}
          categories={bootstrap.categories}
          actions={bootstrap.actions}
          viewTiers={bootstrap.viewTiers}
          multiplierEvents={bootstrap.multiplierEvents}
        />
      </div>
    </main>
  );
}
