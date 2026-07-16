import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!rawUrl || !serviceKey) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500 });
    }

    // Normalize URL (remove /rest/v1/ suffix if present from process env)
    const cleanUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

    const supabase = createClient(cleanUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName?.trim() || email.split('@')[0] },
    });

    if (error) {
      if (error.message?.toLowerCase().includes('already')) {
        // User exists — try login with fresh client
        const loginClient = createClient(cleanUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim());
        const { data: loginData, error: loginError } = await loginClient.auth.signInWithPassword({ email, password });
        if (loginError) {
          return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 });
        }
        return NextResponse.json({
          user: loginData.user,
          session: loginData.session,
          type: 'login',
        });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sign in with a fresh client (not admin, to get a proper session)
    const freshClient = createClient(cleanUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim());
    const { data: sessionData, error: signInError } = await freshClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !sessionData?.session) {
      return NextResponse.json({
        user: data.user,
        session: null,
        debug: signInError?.message || 'session null after signInWithPassword',
      });
    }

    return NextResponse.json({
      user: data.user,
      session: sessionData.session,
      type: 'signup',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno.' },
      { status: 500 },
    );
  }
}
