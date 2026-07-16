import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName?.trim() || email.split('@')[0],
      },
    });

    if (error) {
      if (error.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado.' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    // The service-role client is only used for the MVP account creation above.
    // Authentication and session cookies are established by the browser anon client.
    return NextResponse.json({ user: data.user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
