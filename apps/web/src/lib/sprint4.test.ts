import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import {
  PLANS,
  dunningSchedule,
  hasPlanAccess,
  normalizeEfiWebhook,
  trialDaysRemaining,
  verifyEfiSignature,
} from './sprint4.ts';

test('expõe os três planos com preços em centavos e anual recomendado', () => {
  assert.deepEqual(PLANS.map(({ code, priceCents }) => [code, priceCents]), [
    ['trial', 0],
    ['monthly', 2990],
    ['annual', 24990],
  ]);
  assert.equal(PLANS.find((plan) => plan.code === 'annual')?.recommended, true);
});

test('calcula dias restantes do trial arredondando para cima', () => {
  assert.equal(trialDaysRemaining('2026-07-18T11:00:00.000Z', new Date('2026-07-16T12:00:00.000Z')), 2);
  assert.equal(trialDaysRemaining('2026-07-15T00:00:00.000Z', new Date('2026-07-16T12:00:00.000Z')), 0);
});

test('libera acesso ativo e trial vigente, mas bloqueia vencido', () => {
  const now = new Date('2026-07-16T12:00:00.000Z');
  assert.equal(hasPlanAccess({ status: 'active', trialEndsAt: null, currentPeriodEnd: null }, now), true);
  assert.equal(hasPlanAccess({ status: 'trialing', trialEndsAt: '2026-07-17T00:00:00.000Z', currentPeriodEnd: null }, now), true);
  assert.equal(hasPlanAccess({ status: 'trialing', trialEndsAt: '2026-07-15T00:00:00.000Z', currentPeriodEnd: null }, now), false);
});

test('gera retentativas em 3, 7 e 14 dias', () => {
  assert.deepEqual(
    dunningSchedule(new Date('2026-07-16T12:00:00.000Z')).map((date) => date.toISOString()),
    ['2026-07-19T12:00:00.000Z', '2026-07-23T12:00:00.000Z', '2026-07-30T12:00:00.000Z'],
  );
});

test('valida token literal e assinatura HMAC sha256 sem aceitar valor incorreto', () => {
  const body = '{"event":"charge_confirmed"}';
  const secret = 'segredo-do-webhook';
  const signature = createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(verifyEfiSignature(body, secret, secret), true);
  assert.equal(verifyEfiSignature(body, `sha256=${signature}`, secret), true);
  assert.equal(verifyEfiSignature(body, 'incorreto', secret), false);
});

test('normaliza webhook sem persistir dados sensíveis', () => {
  const event = normalizeEfiWebhook({
    id: 'evt_1',
    event: 'charge_confirmed',
    data: {
      subscription_id: 123,
      charge_id: 456,
      amount: 2990,
      payment_method: 'credit_card',
      card: { last_four_digits: '4242', number: '4111111111111111', cvv: '123' },
    },
  });
  assert.deepEqual(event, {
    eventId: 'evt_1',
    type: 'charge_confirmed',
    subscriptionId: '123',
    chargeId: '456',
    amountCents: 2990,
    paymentMethod: 'credit_card',
    cardLast4: '4242',
  });
});
