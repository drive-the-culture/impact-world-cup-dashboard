'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryBreakdown } from '@/lib/types';
import { categoryColor, formatPoints } from '@/lib/util/format';

export function Chart({ data }: { data: CategoryBreakdown[] }) {
  const total = data.reduce((sum, d) => sum + d.points, 0);

  if (total === 0) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-white/40">
        Points breakdown by category appears here once submissions are approved.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-lg font-semibold text-white">Points by category</h2>
      <p className="mt-1 text-xs text-white/40">
        {formatPoints(total)} total impact points this week
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1.2fr] sm:items-center">
        <div className="relative h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="points"
                nameKey="label"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.category} fill={categoryColor(d.category)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(11, 18, 32, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  formatPoints(Number(value)) + ' pts',
                  String(name ?? ''),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-white">{formatPoints(total)}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">points</div>
          </div>
        </div>

        <ul className="space-y-1.5 text-xs">
          {data
            .slice()
            .sort((a, b) => b.points - a.points)
            .map((d) => {
              const pct = total > 0 ? Math.round((d.points / total) * 100) : 0;
              return (
                <li key={d.category} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: categoryColor(d.category) }}
                  />
                  <span className="text-white/80">
                    {d.emoji} {d.label}
                  </span>
                  <span className="ml-auto tabular-nums text-white/40">{pct}%</span>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}
