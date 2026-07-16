import { after, NextResponse, type NextRequest } from 'next/server';
import { privacySecret, readSignedToken } from '@/lib/privacy';
import { processAccountDeletion } from '@/lib/privacy-server';
import { createAdminClient } from '@/lib/supabase/admin';

function resultPage(title: string, message: string, status = 200) {
  return new NextResponse(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:64px auto;padding:24px;color:#18332a"><h1>${title}</h1><p>${message}</p><a href="/">Voltar ao Jornada Leve</a></body></html>`, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function GET(request: NextRequest) {
  let token;
  try {
    token = readSignedToken(request.nextUrl.searchParams.get('token') ?? '', privacySecret(), 'delete-account');
  } catch {
    return resultPage('Serviço indisponível', 'A confirmação de privacidade não está configurada.', 503);
  }
  if (!token?.requestId) return resultPage('Link inválido', 'O link é inválido ou expirou. Faça uma nova solicitação na área de privacidade.', 400);
  const admin = createAdminClient();
  const { data, error } = await admin.from('privacy_requests')
    .update({ status: 'confirmed' })
    .eq('id', token.requestId)
    .eq('user_id', token.userId)
    .eq('request_type', 'deletion')
    .eq('status', 'awaiting_confirmation')
    .select('id')
    .maybeSingle();
  if (error) return resultPage('Não foi possível confirmar', 'Tente novamente ou fale com o suporte.', 500);
  if (!data) return resultPage('Solicitação já processada', 'Este link já foi usado ou a solicitação não está mais disponível.');
  after(async () => { await processAccountDeletion(data.id).catch(() => undefined); });
  return resultPage('Exclusão confirmada', 'Sua solicitação entrou na fila e será concluída em até 15 dias. Você receberá um e-mail quando o processo terminar.');
}
