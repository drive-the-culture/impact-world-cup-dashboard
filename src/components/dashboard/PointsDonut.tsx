'use client';

import dynamic from 'next/dynamic';
import type { CategoryBreakdown } from '@/lib/types';

// Recharts doesn't render server-side cleanly (ResponsiveContainer needs a
// real DOM). Defer the actual chart to client-only mount.
const Chart = dynamic(() => import('./PointsDonutChart').then((m) => m.Chart), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="h-24 w-24 animate-pulse rounded-full border-[18px] border-white/10" />
    </div>
  ),
});

export function PointsDonut({ data }: { data: CategoryBreakdown[] }) {
  return <Chart data={data} />;
}
