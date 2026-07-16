import assert from 'node:assert/strict';
import test from 'node:test';
import { createSignedToken, readSignedToken } from './privacy.ts';

test('token assinado preserva escopo, usuário e expiração', () => {
  const token = createSignedToken({ purpose: 'unsubscribe', userId: 'user-1', email: 'pessoa@example.com' }, 'segredo-com-pelo-menos-32-caracteres', new Date('2026-07-16T12:00:00Z'), 60);
  assert.deepEqual(readSignedToken(token, 'segredo-com-pelo-menos-32-caracteres', 'unsubscribe', new Date('2026-07-16T12:00:30Z')), {
    purpose: 'unsubscribe', userId: 'user-1', email: 'pessoa@example.com', exp: 1784203260,
  });
});

test('token adulterado, expirado ou usado em outro escopo é rejeitado', () => {
  const token = createSignedToken({ purpose: 'delete-account', userId: 'user-1', requestId: 'request-1', email: 'pessoa@example.com' }, 'segredo-com-pelo-menos-32-caracteres', new Date('2026-07-16T12:00:00Z'), 60);
  assert.equal(readSignedToken(`${token}x`, 'segredo-com-pelo-menos-32-caracteres', 'delete-account', new Date('2026-07-16T12:00:30Z')), null);
  assert.equal(readSignedToken(token, 'segredo-com-pelo-menos-32-caracteres', 'unsubscribe', new Date('2026-07-16T12:00:30Z')), null);
  assert.equal(readSignedToken(token, 'segredo-com-pelo-menos-32-caracteres', 'delete-account', new Date('2026-07-16T12:01:01Z')), null);
});
