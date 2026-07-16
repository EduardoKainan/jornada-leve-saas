import assert from 'node:assert/strict';
import test from 'node:test';
import { createPixCharge, normalizePixWebhook, pixBaseUrl } from './efi.ts';
import { PLANS } from './sprint4.ts';

test('cria cobrança PIX e retorna QR Code e código copia e cola', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    clientId: process.env.EFI_PIX_CLIENT_ID,
    clientSecret: process.env.EFI_PIX_CLIENT_SECRET,
    pixKey: process.env.PIX_KEY,
    sandbox: process.env.EFI_SANDBOX,
  };
  process.env.EFI_PIX_CLIENT_ID = 'cliente-pix';
  process.env.EFI_PIX_CLIENT_SECRET = 'segredo-pix';
  process.env.PIX_KEY = '63929774-fd74-45dc-8015-21aa7afa8f30';
  process.env.EFI_SANDBOX = 'true';

  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    if (requests.length === 1) {
      return Response.json({ access_token: 'token-pix', expires_in: 3600 });
    }
    if (requests.length === 2) {
      return Response.json({ txid: 'pix-txid-123', loc: { id: 987 } });
    }
    return Response.json({
      qrcode: '00020101021226890014br.gov.bcb.pix...',
      imagemQrcode: 'data:image/png;base64,QUJD',
    });
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv.clientId === undefined) delete process.env.EFI_PIX_CLIENT_ID;
    else process.env.EFI_PIX_CLIENT_ID = originalEnv.clientId;
    if (originalEnv.clientSecret === undefined) delete process.env.EFI_PIX_CLIENT_SECRET;
    else process.env.EFI_PIX_CLIENT_SECRET = originalEnv.clientSecret;
    if (originalEnv.pixKey === undefined) delete process.env.PIX_KEY;
    else process.env.PIX_KEY = originalEnv.pixKey;
    if (originalEnv.sandbox === undefined) delete process.env.EFI_SANDBOX;
    else process.env.EFI_SANDBOX = originalEnv.sandbox;
  });

  const plan = PLANS.find((item) => item.code === 'monthly');
  assert.ok(plan);
  const result = await createPixCharge({ plan, userId: 'usuario-uuid' });

  assert.deepEqual(result, {
    txid: 'pix-txid-123',
    chargeId: 'pix-txid-123',
    qrCodeImage: 'data:image/png;base64,QUJD',
    pixCopiaECola: '00020101021226890014br.gov.bcb.pix...',
  });
  assert.equal(pixBaseUrl(), 'https://pix-h.api.efipay.com.br');
  assert.equal(requests[0]?.url, 'https://pix-h.api.efipay.com.br/oauth/token');
  assert.equal((requests[0]?.init?.headers as Record<string, string>).authorization, `Basic ${Buffer.from('cliente-pix:segredo-pix').toString('base64')}`);
  assert.equal(requests[1]?.url, 'https://pix-h.api.efipay.com.br/v2/cob');
  assert.equal(requests[1]?.init?.method, 'POST');
  assert.equal(requests[2]?.url, 'https://pix-h.api.efipay.com.br/v2/loc/987/qrcode');

  const body = JSON.parse(String(requests[1]?.init?.body)) as Record<string, unknown>;
  assert.deepEqual(body, {
    calendario: { expiracao: 3600 },
    valor: { original: '29.90' },
    chave: '63929774-fd74-45dc-8015-21aa7afa8f30',
    solicitacaoPagador: 'Jornada Leve - Plano Mensal',
    infoAdicionais: [
      { nome: 'user_id', valor: 'usuario-uuid' },
      { nome: 'plano', valor: 'monthly' },
    ],
  });
});

test('normaliza webhook PIX concluído usando o txid como cobrança', () => {
  assert.deepEqual(normalizePixWebhook({
    status: 'CONCLUIDA',
    pix: [{ txid: 'pix-txid-123', endToEndId: 'E123', valor: '29.90', horario: '2026-07-16T10:00:00Z' }],
  }), {
    status: 'CONCLUIDA',
    txid: 'pix-txid-123',
    eventId: 'E123',
    amountCents: 2990,
  });
});
