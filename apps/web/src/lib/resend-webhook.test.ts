import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { normalizeResendEvent, verifyResendWebhook } from './resend-webhook.ts';

function signedHeaders(body: string, secret: string, timestamp = Math.floor(Date.now() / 1000)) {
  const id = 'msg_test';
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
  return { id, timestamp: String(timestamp), signature: `v1,${signature}` };
}

test('valida assinatura Svix usada pelo Resend e rejeita corpo adulterado', () => {
  const secret = `whsec_${Buffer.from('segredo-de-teste-com-32-bytes!!').toString('base64')}`;
  const body = '{"type":"email.delivered"}';
  assert.equal(verifyResendWebhook(body, signedHeaders(body, secret), secret), true);
  assert.equal(verifyResendWebhook(`${body} `, signedHeaders(body, secret), secret), false);
});

test('rejeita webhook fora da tolerância de cinco minutos', () => {
  const secret = `whsec_${Buffer.from('segredo-de-teste-com-32-bytes!!').toString('base64')}`;
  const body = '{}';
  assert.equal(verifyResendWebhook(body, signedHeaders(body, secret, Math.floor(Date.now() / 1000) - 301), secret), false);
});

test('normaliza eventos suportados sem dados do destinatário', () => {
  assert.deepEqual(normalizeResendEvent({ type: 'email.bounced', data: { email_id: 'email_123', bounce: { type: 'Permanent' }, to: ['privado@example.com'] } }), {
    providerMessageId: 'email_123', status: 'bounced', errorCode: 'Permanent', suppress: true,
  });
  assert.deepEqual(normalizeResendEvent({ type: 'email.complained', data: { email_id: 'email_456' } }), {
    providerMessageId: 'email_456', status: 'complained', errorCode: 'complaint', suppress: true,
  });
  assert.deepEqual(normalizeResendEvent({ type: 'email.delivered', data: { email_id: 'email_789' } }), {
    providerMessageId: 'email_789', status: 'delivered', errorCode: null, suppress: false,
  });
});
