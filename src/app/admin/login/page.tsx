import { LoginForm } from './LoginForm';

type Props = {
  searchParams: Promise<{ error?: string; redirectTo?: string; sent?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const notAuthorized = params.error === 'not-authorized';
  const linkSent = params.sent === '1';

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold text-white">Admin sign-in</h1>
        <p className="mt-2 text-sm text-white/60">
          We&apos;ll email you a one-time link. Only addresses on the admin
          allowlist can sign in.
        </p>

        {notAuthorized && (
          <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            That email isn&apos;t on the admin allowlist. Ask the project owner
            to add you.
          </div>
        )}

        {linkSent ? (
          <div className="mt-6 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Magic link sent. Check your email and click the link to finish
            signing in.
          </div>
        ) : (
          <LoginForm redirectTo={params.redirectTo} />
        )}
      </div>
    </main>
  );
}
