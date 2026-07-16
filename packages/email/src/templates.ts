export type TemplateName =
  | 'welcome'
  | 'password-reset'
  | 'checkin-reminder'
  | 'subscription-confirmed'
  | 'payment-failed'
  | 'subscription-cancelled'
  | 'privacy-export-ready'
  | 'account-deletion-confirmation'
  | 'account-deletion-completed';

export type EmailTemplateProps = {
  displayName?: string;
  actionUrl?: string;
  unsubscribeUrl?: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

const DEFAULT_APP_URL = 'https://jornadaleve.com.br';
const medicalDisclaimer = 'O Jornada Leve organiza informações fornecidas por você e não substitui orientação, diagnóstico ou acompanhamento profissional.';

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] ?? character);
}

function templateContent(template: TemplateName, name: string, actionUrl: string) {
  const link = escapeHtml(actionUrl);
  const salutation = name ? `Olá, ${escapeHtml(name)}!` : 'Olá!';
  switch (template) {
    case 'welcome': return {
      subject: 'Bem-vindo ao Jornada Leve', title: 'Bem-vindo ao Jornada Leve',
      message: `${salutation} Que bom ter você por aqui. Faça seu primeiro registro para começar a acompanhar sua jornada.`,
      cta: 'Fazer primeiro registro', link, health: true,
    };
    case 'password-reset': return {
      subject: 'Redefina sua senha do Jornada Leve', title: 'Redefinição de senha',
      message: `${salutation} Recebemos uma solicitação para redefinir sua senha. Este link é pessoal e temporário. Se não foi você, ignore este e-mail.`,
      cta: 'Redefinir senha', link, health: false,
    };
    case 'checkin-reminder': return {
      subject: 'Não esqueça de registrar hoje', title: 'Seu registro de hoje',
      message: `${salutation} Reserve um momento para registrar seu dia no Jornada Leve.`,
      cta: 'Registrar agora', link, health: true,
    };
    case 'subscription-confirmed': return {
      subject: 'Sua assinatura foi ativada', title: 'Assinatura ativada',
      message: `${salutation} Seu acesso está ativo. Agora você pode continuar usando todos os recursos do Jornada Leve.`,
      cta: 'Acessar o Jornada Leve', link, health: false,
    };
    case 'payment-failed': return {
      subject: 'Seu pagamento não foi aprovado', title: 'Revise seu pagamento',
      message: `${salutation} Não foi possível confirmar seu pagamento. Atualize os dados de cobrança com segurança pelo aplicativo.`,
      cta: 'Atualizar pagamento', link, health: false,
    };
    case 'subscription-cancelled': return {
      subject: 'Cancelamento confirmado', title: 'Sua assinatura foi cancelada',
      message: `${salutation} Confirmamos o cancelamento. Seu acesso seguirá as condições informadas na área do plano.`,
      cta: 'Ver detalhes do plano', link, health: false,
    };
    case 'privacy-export-ready': return {
      subject: 'Sua exportação de dados está pronta', title: 'Exportação de dados',
      message: `${salutation} O arquivo solicitado está pronto. O link é pessoal, temporário e pode conter dados sensíveis. Não o compartilhe.`,
      cta: 'Baixar meus dados', link, health: true,
    };
    case 'account-deletion-confirmation': return {
      subject: 'Confirme a exclusão da sua conta', title: 'Solicitação de exclusão',
      message: `${salutation} Confirme esta solicitação pelo link seguro. Após a confirmação, a exclusão será processada em até 15 dias.`,
      cta: 'Confirmar exclusão', link, health: false,
    };
    case 'account-deletion-completed': return {
      subject: 'Sua conta foi excluída', title: 'Exclusão concluída',
      message: `${salutation} Sua conta e os arquivos associados foram excluídos conforme sua solicitação.`,
      cta: 'Ir para o Jornada Leve', link, health: false,
    };
  }
}

export function renderEmail(template: TemplateName, props: EmailTemplateProps = {}): RenderedEmail {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL).replace(/\/$/, '');
  const actionUrl = props.actionUrl ?? `${appUrl}/app`;
  const unsubscribeUrl = props.unsubscribeUrl ?? `${appUrl}/api/email/unsubscribe`;
  const content = templateContent(template, props.displayName?.trim() ?? '', actionUrl);
  const disclaimer = content.health ? `<p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.5">${medicalDisclaimer}</p>` : '';
  const text = `${content.title}\n\n${content.message}\n\n${content.cta}: ${actionUrl}${content.health ? `\n\n${medicalDisclaimer}` : ''}\n\nDescadastrar: ${unsubscribeUrl}\nJornada Leve Tecnologia Ltda. — Consulte nosso aviso de privacidade.`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(content.subject)}</title></head><body style="margin:0;background:#f4f7f5;font-family:Arial,sans-serif;color:#18332a"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(content.subject)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f5;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #dce8e1;border-radius:16px;overflow:hidden"><tr><td style="padding:28px 32px;background:#eaf6ef"><div style="font-size:22px;font-weight:700;color:#157347">● Jornada Leve</div></td></tr><tr><td style="padding:32px"><h1 style="margin:0 0 16px;font-size:26px;line-height:1.25">${escapeHtml(content.title)}</h1><p style="margin:0 0 26px;color:#456158;line-height:1.65">${content.message}</p><a href="${content.link}" style="display:inline-block;background:#157347;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px">${escapeHtml(content.cta)}</a>${disclaimer}</td></tr><tr><td style="padding:22px 32px;border-top:1px solid #e5ece8;color:#6b7d76;font-size:12px;line-height:1.6;text-align:center"><strong>Jornada Leve Tecnologia Ltda.</strong><br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#456158">Descadastrar destes e-mails</a> · <a href="${appUrl}/privacidade" style="color:#456158">Aviso de privacidade</a></td></tr></table></td></tr></table></body></html>`;
  return { subject: content.subject, html, text };
}
