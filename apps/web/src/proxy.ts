import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  function redirect(pathname: string, next?: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = '';
    if (next) url.searchParams.set('next', next);

    const redirectResponse = NextResponse.redirect(url);
    // Preserve tokens refreshed by getUser() on the redirect response.
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  const protectedRoute = path.startsWith('/app') || path.startsWith('/onboarding') || path.startsWith('/admin');
  if (protectedRoute && !user) {
    return redirect('/entrar', `${path}${request.nextUrl.search}`);
  }
  if (user && (path === '/entrar' || path === '/cadastro')) {
    return redirect('/app');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};