import { getFormBootstrap } from '@/lib/queries';
import { SubmitForm } from './SubmitForm';

export const dynamic = 'force-dynamic';

export default async function SubmitPage() {
  const data = await getFormBootstrap();
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA';

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Log impact</h1>
        <p className="mt-2 text-sm text-white/60">
          Tell us what you did. Points are estimated automatically from{' '}
          <a
            href="https://github.com/your-org/repo/blob/main/supabase/SCORING_RUBRIC.md"
            className="underline decoration-amber-400/40 underline-offset-2 hover:text-white"
          >
            the rubric
          </a>{' '}
          — a reviewer confirms before they hit the scoreboard.
        </p>
      </div>

      <SubmitForm
        teams={data.teams}
        categories={data.categories}
        actions={data.actions}
        viewTiers={data.viewTiers}
        multiplierEvents={data.multiplierEvents}
        turnstileSiteKey={turnstileSiteKey}
      />
    </main>
  );
}
