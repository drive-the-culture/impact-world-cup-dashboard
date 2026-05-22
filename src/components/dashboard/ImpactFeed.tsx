import { getRecentFeed } from '@/lib/queries';
import { categoryColor, formatPoints, timeAgo } from '@/lib/util/format';

export async function ImpactFeed() {
  const entries = await getRecentFeed(15);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-white/40">
        Approved events show up here in real time.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <header className="flex items-baseline justify-between border-b border-white/5 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Impact feed</h2>
        <span className="text-xs uppercase tracking-widest text-white/40">live</span>
      </header>
      <ol className="divide-y divide-white/5">
        {entries.map((e) => (
          <li key={e.event_id} className="flex items-start gap-3 px-6 py-3">
            {e.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={e.logo_url}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-white/60">
                {e.team_name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-medium text-white">{e.team_name}</span>
                {e.creator_name && (
                  <span className="truncate text-xs text-white/40">· {e.creator_name}</span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs">
                <span
                  className="inline-block rounded-full px-2 py-0.5 font-medium"
                  style={{
                    background: `${categoryColor(e.category)}22`,
                    color: categoryColor(e.category),
                  }}
                >
                  {e.action_label}
                </span>
                <span className="text-white/40">{timeAgo(e.created_at)}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-base font-semibold text-amber-300">
                +{formatPoints(e.points)}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/30">pts</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
