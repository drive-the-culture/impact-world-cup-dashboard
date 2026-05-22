import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Admin</h1>
        <div className="text-sm text-white/60">
          Signed in as <span className="text-white">{user?.email ?? '—'}</span>
        </div>
      </div>

      <nav className="mt-6 flex gap-2 text-sm">
        <Link
          href="/admin"
          className="rounded-lg bg-white/10 px-3 py-2 text-white"
        >
          Review queue
        </Link>
        <Link
          href="/admin/scoring"
          className="rounded-lg px-3 py-2 text-white/70 hover:bg-white/5"
        >
          Scoring rules
        </Link>
      </nav>

      <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center text-white/40">
        Review queue ships Day 4.
      </div>
    </main>
  );
}
