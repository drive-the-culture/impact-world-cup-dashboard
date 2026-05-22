import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Magic-link callback. Supabase redirects here with ?code=... after the user
// clicks the email link. Exchange the code for a session cookie, then send
// the user to their original destination (or /admin by default).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/admin';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const url = new URL('/admin/login', origin);
  url.searchParams.set('error', 'callback-failed');
  return NextResponse.redirect(url);
}
