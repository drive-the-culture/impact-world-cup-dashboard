'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Subscribes to impact_events INSERT/UPDATE. On any change, triggers a
// router.refresh() so the three server components (Leaderboard, donut,
// feed) re-fetch from the server. No-ops when env is the placeholder
// (channel.subscribe just never fires).
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    if (!url || url.includes('placeholder')) return;

    const supabase = createClient();
    const channel = supabase
      .channel('impact_events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'impact_events' },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return <>{children}</>;
}
