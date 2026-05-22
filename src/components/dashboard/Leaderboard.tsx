import { getLeaderboard } from '@/lib/queries';
import { formatPoints } from '@/lib/util/format';

export async function Leaderboard() {
  const rows = await getLeaderboard();

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40">
        No approved impact yet. The first event drops May 28.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <header className="flex items-baseline justify-between border-b border-white/5 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">
          Live Impact Scoreboard
          <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400 align-middle" />
        </h2>
        <span className="text-xs uppercase tracking-widest text-white/40">
          {rows.length} active team{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <table className="w-full text-sm">
        <thead className="bg-white/[0.02] text-left text-xs uppercase tracking-wider text-white/40">
          <tr>
            <th className="w-12 px-6 py-3 text-center">#</th>
            <th className="px-3 py-3">Team</th>
            <th className="px-3 py-3 text-right">Events</th>
            <th className="px-6 py-3 text-right">Impact pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-white">
          {rows.map((r, i) => {
            const rank = i + 1;
            const isTop = rank <= 3;
            return (
              <tr key={r.team_id} className={isTop ? 'bg-amber-400/[0.03]' : undefined}>
                <td className="px-6 py-3 text-center">
                  <span
                    className={
                      rank === 1
                        ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 font-bold text-slate-950'
                        : rank === 2
                          ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 font-bold text-slate-950'
                          : rank === 3
                            ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 font-bold text-white'
                            : 'text-white/40'
                    }
                  >
                    {rank}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {r.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.logo_url}
                        alt=""
                        className="h-8 w-8 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white/60">
                        {r.team_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{r.team_name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-white/60">
                  {r.event_count}
                </td>
                <td className="px-6 py-3 text-right font-mono text-base font-semibold">
                  {formatPoints(r.total_points)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
