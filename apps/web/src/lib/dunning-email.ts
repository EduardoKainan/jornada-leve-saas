type DunningEmailKind = 'payment_failed' | 'subscription_canceled';

const copy: Record<DunningEmailKind, { subject: string; title: string; message: string }> = {
  payment_failed: {
    subject: 'Não conseguimos processar seu pagamento',
    title: 'Vamos manter sua jornada em dia',
    message: 'Não foi possível processar sua cobrança. Faremos uma nova tentativa automaticamente. Confira seus dados de pagamento para evitar a interrupção do acesso.',
  },
  subscription_canceled: {
    subject: 'Sua assinatura Jornada Leve foi cancelada',
    title: 'Sua assinatura foi cancelada',
    message: 'Após três tentativas de cobrança, sua assinatura foi cancelada. Você pode escolher um plano novamente quando quiser.',
  },
};

export async function sendDunningEmail(to: string, kind: DunningEmailKind): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;
  const content = copy[kind];
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL?.trim() || 'Jornada Leve <nao-responda@jornadaleve.com.br>',
      to: [to],
      subject: content.subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#24342c"><h1 style="font-size:24px">${content.title}</h1><p style="line-height:1.6">${content.message}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/app/cobranca" style="color:#27734f">Ver minha cobrança</a></p></div>`,
    }),
    cache: 'no-store',
  });
  return response.ok;
}
