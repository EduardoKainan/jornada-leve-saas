import { NextResponse, type NextRequest } from 'next/server';
import { privacySecret, readSignedToken } from '@/lib/privacy';
import { createAdminClient } from '@/lib/supabase/admin';

function page(title: string, message: string, status = 200) {
  return new NextResponse(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:64px auto;padding:24px;color:#18332a"><h1>${title}</h1><p>${message}</p><a href="/app/privacidade">Gerenciar privacidade</a></body></html>`, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

async function unsubscribe(request: NextRequest) {
  let payload;
  try {
    payload = readSignedToken(request.nextUrl.searchParams.get('token') ?? '', privacySecret(), 'unsubscribe');
  } catch {
    return page('Serviço indisponível', 'O descadastro não está configurado.', 503);
  }
  if (!payload) return page('Link inválido', 'O link de descadastro é inválido ou expirou.', 400);
  const admin = createAdminClient();
  const { error } = await admin.from('notification_preferences').update({ enabled: false }).eq('user_id', payload.userId).eq('channel', 'email');
  if (error) return page('Não foi possível descadastrar', 'Tente novamente ou fale com o suporte.', 500);
  await admin.from('audit_events').insert({ actor_user_id: payload.userId, action: 'email_unsubscribed', resource_type: 'notification_preferences', reason_code: 'user_request', metadata_redacted: { channel: 'email' } });
  return page('Descadastro concluído', 'Os e-mails opcionais foram desativados. Mensagens estritamente necessárias sobre segurança e privacidade ainda poderão ser enviadas.');
}

export const GET = unsubscribe;
export const POST = unsubscribe;
