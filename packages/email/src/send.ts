export type TemplateName =
  | 'welcome'
  | 'checkin-reminder'
  | 'event-reminder'
  | 'appointment-reminder'
  | 'report-ready'
  | 'payment-failed'
  | 'unsubscribed';

export interface SendEmailParams {
  to: string;
  subject: string;
  template: TemplateName;
  props?: Record<string, string>;
}

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ??
  'https://jornadaleve.com.br') as string;

function wrapHtml(bodyHtml: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
  <table role="presentation" style="width:100%;max-width:600px;margin:40px auto;background:#fff;border-radius:8px;border:1px solid #e4e4e7;">
    <tr>
      <td style="padding:32px;">
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">
          <a href="${unsubscribeUrl}" style="color:#a1a1aa;text-decoration:underline;">Cancelar inscrição</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getTemplateHtml(template: TemplateName, props?: Record<string, string>): { subject: string; html: string } {
  const displayName = props?.displayName ?? 'Usuário';

  switch (template) {
    case 'welcome':
      return {
        subject: 'Bem-vindo ao Jornada Leve',
        html: `<h1 style="margin:0 0 16px;font-size:24px;color:#18181b;">Seja bem-vindo, ${displayName}!</h1>
<p style="margin:0 0 24px;color:#71717a;line-height:1.5;">Comece registrando seu peso inicial e configure sua rotina para acompanhar sua evolução.</p>
<table role="presentation" style="width:100%;"><tr><td style="text-align:center;">
  <a href="${baseUrl}/app" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Começar agora</a>
</td></tr></table>`,
      };

    case 'checkin-reminder':
      return {
        subject: 'Seu check-in do Jornada Leve está disponível',
        html: `<p style="margin:0 0 24px;color:#71717a;line-height:1.5;">Olá! Seu check-in de hoje está disponível. Acesse o app para registrar seu dia.</p>
<table role="presentation" style="width:100%;"><tr><td style="text-align:center;">
  <a href="${baseUrl}/app/check-in" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Fazer check-in</a>
</td></tr></table>`,
      };

    case 'event-reminder':
      return {
        subject: 'Você tem uma atividade programada',
        html: `<p style="margin:0 0 24px;color:#71717a;line-height:1.5;">Você tem uma atividade programada no Jornada Leve. Acesse o app para conferir os detalhes.</p>
<table role="presentation" style="width:100%;"><tr><td style="text-align:center;">
  <a href="${baseUrl}/app/calendario" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Ver atividade</a>
</td></tr></table>`,
      };

    case 'appointment-reminder':
      return {
        subject: 'Sua consulta está chegando',
        html: `<p style="margin:0 0 24px;color:#71717a;line-height:1.5;">Sua consulta cadastrada está se aproximando. Você pode revisar seus registros e gerar um relatório no Jornada Leve.</p>
<table role="presentation" style="width:100%;"><tr><td style="text-align:center;">
  <a href="${baseUrl}/app/relatorios" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Gerar relatório</a>
</td></tr></table>`,
      };

    case 'report-ready':
      return {
        subject: 'Seu relatório do Jornada Leve está pronto',
        html: `<p style="margin:0 0 24px;color:#71717a;line-height:1.5;">Seu relatório está disponível. Acesse o app para visualizar com segurança.</p>
<table role="presentation" style="width:100%;"><tr><td style="text-align:center;">
  <a href="${baseUrl}/app/relatorios" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Ver relatório</a>
</td></tr></table>`,
      };

    case 'payment-failed':
      return {
        subject: 'Renovação do Jornada Leve',
        html: `<p style="margin:0 0 24px;color:#71717a;line-height:1.5;">Não conseguimos confirmar a renovação do Jornada Leve. Acesse sua conta para revisar o pagamento.</p>
<table role="presentation" style="width:100%;"><tr><td style="text-align:center;">
  <a href="${baseUrl}/app/plano" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Revisar pagamento</a>
</td></tr></table>`,
      };

    case 'unsubscribed':
      return {
        subject: 'Lembretes pausados',
        html: `<p style="margin:0 0 24px;color:#71717a;line-height:1.5;">Lembretes por e-mail foram pausados. Você pode reativá-los nas configurações do Jornada Leve.</p>
<table role="presentation" style="width:100%;"><tr><td style="text-align:center;">
  <a href="${baseUrl}/app/configuracoes#notificacoes" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Reativar lembretes</a>
</td></tr></table>`,
      };

    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

export async function sendEmail(params: SendEmailParams) {
  const { to, subject, template, props } = params;
  const from = 'Jornada Leve <noreply@jornadaleve.com.br>';
  const { subject: emailSubject, html: bodyHtml } = getTemplateHtml(template, props);
  const unsubscribeUrl = `${baseUrl}/app/configuracoes#notificacoes`;
  const html = wrapHtml(bodyHtml, unsubscribeUrl);

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  return resend.emails.send({
    from,
    to,
    subject: subject || emailSubject,
    html,
  });
}
