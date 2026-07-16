import assert from 'node:assert/strict';
import test from 'node:test';
import { createEfiCharge } from './efi.ts';
import { PLANS } from './sprint4.ts';

test('cria cobrança avulsa na Efí e retorna o link de pagamento', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    clientId: process.env.EFI_CLIENT_ID,
    clientSecret: process.env.EFI_CLIENT_SECRET,
    sandbox: process.env.EFI_SANDBOX,
  };
  process.env.EFI_CLIENT_ID = 'cliente';
  process.env.EFI_CLIENT_SECRET = 'segredo';
  process.env.EFI_SANDBOX = 'true';

  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    if (requests.length === 1) {
      return Response.json({ access_token: 'token', expires_in: 3600 });
    }
    return Response.json({ data: { charge_id: 456, payment_url: 'https://pagamento.exemplo/456' } });
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv.clientId === undefined) delete process.env.EFI_CLIENT_ID;
    else process.env.EFI_CLIENT_ID = originalEnv.clientId;
    if (originalEnv.clientSecret === undefined) delete process.env.EFI_CLIENT_SECRET;
    else process.env.EFI_CLIENT_SECRET = originalEnv.clientSecret;
    if (originalEnv.sandbox === undefined) delete process.env.EFI_SANDBOX;
    else process.env.EFI_SANDBOX = originalEnv.sandbox;
  });

  const plan = PLANS.find((item) => item.code === 'monthly');
  assert.ok(plan);
  const result = await createEfiCharge({
    plan,
    name: 'Maria Silva',
    email: 'maria@example.com',
    callbackUrl: 'https://jornadaleve.com/app/cobranca?checkout=retorno',
  });

  assert.deepEqual(result, {
    chargeId: '456',
    checkoutUrl: 'https://pagamento.exemplo/456',
  });
  assert.equal(requests[1]?.url, 'https://cobrancas-h.api.efipay.com.br/v1/charge');
  assert.equal(requests[1]?.init?.method, 'POST');
  const body = JSON.parse(String(requests[1]?.init?.body)) as Record<string, unknown>;
  assert.deepEqual(body.items, [{ name: 'Jornada Leve - Plano Mensal', value: 2990, amount: 1 }]);
  assert.deepEqual(body.customer, { name: 'Maria Silva', email: 'maria@example.com' });
  assert.equal(body.redirect_url, 'https://jornadaleve.com/app/cobranca?checkout=retorno');
  assert.equal((body.payment as { status?: string }).status, 'created');
  assert.match((body.payment as { banking_billet: { expire_at: string } }).banking_billet.expire_at, /^\d{4}-\d{2}-\d{2}$/);
});
