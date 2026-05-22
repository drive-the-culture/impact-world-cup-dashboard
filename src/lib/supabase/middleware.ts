import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Session refresh + admin gating helper, called from proxy.ts.
// Refreshes the Supabase session cookie on every matched request and,
// for /admin/* routes, verifies the user is on the admins allowlist.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/admin') && path !== '/admin/login';
  const isLoginRoute = path === '/admin/login';

  if (isAdminRoute) {
    if (!user?.email) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirectTo', path);
      return NextResponse.redirect(url);
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('email')
      .eq('email', user.email)
      .maybeSingle();

    if (!admin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('error', 'not-authorized');
      return NextResponse.redirect(url);
    }
  }

  if (isLoginRoute && user?.email) {
    const { data: admin } = await supabase
      .from('admins')
      .select('email')
      .eq('email', user.email)
      .maybeSingle();
    if (admin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      url.searchParams.delete('redirectTo');
      return NextResponse.redirect(url);
    }
  }

  return response;
}
