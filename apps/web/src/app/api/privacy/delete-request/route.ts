import { sendEmail } from '@jornada-leve/email';
import { NextResponse, type NextRequest } from 'next/server';
import { createSignedToken, privacySecret } from '@/lib/privacy';
import { unsubscribeUrl } from '@/lib/privacy-server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || !('confirmation' in body) || body.confirmation !== 'EXCLUIR') {
    return NextResponse.json({ error: 'Digite EXCLUIR para solicitar a exclusão.' }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'O envio da confirmação não está configurado. Nenhum dado foi excluído.' }, { status: 503 });
  try {
    const { data: privacyRequest, error: insertError } = await supabase.from('privacy_requests')
      .insert({ user_id: user.id, request_type: 'deletion', status: 'awaiting_confirmation' })
      .select('id')
      .single();
    if (insertError || !privacyRequest) throw insertError ?? new Error('Solicitação não criada.');
    const token = createSignedToken({ purpose: 'delete-account', userId: user.id, email: user.email, requestId: privacyRequest.id }, privacySecret());
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin).replace(/\/$/, '');
    const { error } = await sendEmail({
      to: user.email,
      template: 'account-deletion-confirmation',
      props: {
        actionUrl: `${appUrl}/api/privacy/delete-confirm?token=${encodeURIComponent(token)}`,
        unsubscribeUrl: unsubscribeUrl(user.id, user.email),
      },
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, message: 'Enviamos um link de confirmação para seu e-mail. Ele expira em 48 horas.' }, { status: 202 });
  } catch {
    return NextResponse.json({ error: 'Não foi possível enviar a confirmação. Nenhum dado foi excluído.' }, { status: 500 });
  }
}
