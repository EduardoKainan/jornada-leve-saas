import assert from 'node:assert/strict';
import test from 'node:test';
import { renderEmail, type TemplateName } from './templates.ts';

const templates: TemplateName[] = [
  'welcome',
  'password-reset',
  'checkin-reminder',
  'subscription-confirmed',
  'payment-failed',
  'subscription-cancelled',
  'privacy-export-ready',
  'account-deletion-confirmation',
  'account-deletion-completed',
];

for (const template of templates) {
  test(`${template} contém identidade, rodapé legal e descadastro funcional`, () => {
    const rendered = renderEmail(template, {
      displayName: '<Eduardo>',
      actionUrl: 'https://jornadaleve.com.br/acao?token=seguro&next=/app',
      unsubscribeUrl: 'https://jornadaleve.com.br/api/email/unsubscribe?token=abc',
    });
    assert.match(rendered.html, /Jornada Leve/);
    assert.match(rendered.html, /Jornada Leve Tecnologia Ltda\./);
    assert.match(rendered.html, /aviso de privacidade/i);
    assert.match(rendered.html, /https:\/\/jornadaleve\.com\.br\/api\/email\/unsubscribe\?token=abc/);
    assert.doesNotMatch(rendered.html, /<Eduardo>/);
    assert.ok(rendered.subject.length > 5);
    assert.ok(rendered.text.length > 20);
  });
}

test('e-mails relacionados a registros de saúde contêm disclaimer médico', () => {
  for (const template of ['welcome', 'checkin-reminder', 'privacy-export-ready'] as const) {
    assert.match(renderEmail(template, { actionUrl: 'https://jornadaleve.com.br/app' }).html, /não substitui orientação, diagnóstico ou acompanhamento profissional/i);
  }
});

test('lembrete não expõe dados de saúde no assunto ou corpo', () => {
  const rendered = renderEmail('checkin-reminder', { actionUrl: 'https://jornadaleve.com.br/app/check-in' });
  assert.equal(rendered.subject, 'Não esqueça de registrar hoje');
  assert.doesNotMatch(`${rendered.subject} ${rendered.text}`, /peso|medida|sintoma|diagnóstico do usuário/i);
});
