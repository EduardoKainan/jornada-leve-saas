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

  const billingRoute = path === '/app/plano' || path.startsWith('/app/plano/') || path === '/app/cobranca' || path.startsWith('/app/cobranca/');
  if (user && path.startsWith('/app') && !billingRoute) {
    const { data: subscription, error: subscriptionError } = await supabase.from('subscriptions')
      .select('status, trial_ends_at, current_period_end')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!subscriptionError) {
      const now = Date.now();
      const active = subscription?.status === 'active' || subscription?.status === 'grace_period';
      const trialActive = subscription?.status === 'trialing' && Boolean(subscription.trial_ends_at) && new Date(subscription.trial_ends_at).getTime() > now;
      const canceledAtPeriodEndActive = subscription?.status === 'canceled_end_of_period' && Boolean(subscription.current_period_end) && new Date(subscription.current_period_end).getTime() > now;
      if (!active && !trialActive && !canceledAtPeriodEndActive) return redirect('/app/plano');
    }
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};