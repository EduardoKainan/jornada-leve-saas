import { renderEmail, type EmailTemplateProps, type TemplateName } from './templates';

export interface SendEmailParams {
  to: string;
  subject?: string;
  template: TemplateName;
  props?: EmailTemplateProps;
}

export async function sendEmail({ to, subject, template, props }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('RESEND_API_KEY não está configurada.');
  const rendered = renderEmail(template, props);
  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL?.trim() || 'Jornada Leve <noreply@jornadaleve.com.br>',
    to,
    subject: subject?.trim() || rendered.subject,
    html: rendered.html,
    text: rendered.text,
    headers: props?.unsubscribeUrl ? { 'List-Unsubscribe': `<${props.unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined,
  });
}
