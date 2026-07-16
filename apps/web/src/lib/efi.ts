import * as fs from 'node:fs';
import * as https from 'node:https';

import type { PlanDefinition } from './sprint4';

const SANDBOX_URL = 'https://pix-h.api.efipay.com.br';
const PRODUCTION_URL = 'https://pix.api.efipay.com.br';

type EfiRecord = Record<string, unknown>;
type CachedToken = { value: string; expiresAt: number; baseUrl: string };
let cachedToken: CachedToken | null = null;

function createAgent(): https.Agent | undefined {
  const certPath = process.env.EFI_PIX_CERT;
  const certB64 = process.env.EFI_PIX_CERT_BASE64;

  function pemAgent(certPem: string) {
    // Find the certificate and private key blocks in the PEM string
    const certMatch = certPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
    const keyMatch = certPem.match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/);
    
    return new https.Agent({
      cert: certMatch?.[0] || certPem,
      key: keyMatch?.[0],
      rejectUnauthorized: false,
    });
  }

  if (certPath) {
    const fs = require('node:fs') as typeof import('node:fs');
    return pemAgent(fs.readFileSync(certPath, 'utf8'));
  }

  if (certB64) {
    return pemAgent(Buffer.from(certB64, 'base64').toString('utf8'));
  }

  return undefined;
}

function asRecord(value: unknown): EfiRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as EfiRecord)
    : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null;
}

function credentials() {
  const clientId = process.env.EFI_PIX_CLIENT_ID?.trim();
  const clientSecret = process.env.EFI_PIX_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error('Credenciais PIX da Efí não configuradas.');
  return { clientId, clientSecret };
}

function pixKey() {
  const key = process.env.PIX_KEY?.trim();
  if (!key) throw new Error('Chave PIX não configurada.');
  return key;
}

export function pixBaseUrl() {
  return process.env.EFI_SANDBOX?.toLowerCase() === 'true' ? SANDBOX_URL : PRODUCTION_URL;
}

type HttpsRequestOptions = {
  method: string;
  headers: Record<string, string>;
  agent?: https.Agent;
};

function httpsRequest(
  url: string,
  options: HttpsRequestOptions,
  body?: string,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method,
        headers: options.headers,
        agent: options.agent,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode ?? 500, body: JSON.parse(data) as unknown });
          } catch {
            resolve({ status: res.statusCode ?? 500, body: data });
          }
        });
      },
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function parseResponse(response: { status: number; body: unknown }): EfiRecord {
  if (response.status < 200 || response.status >= 300) {
    const body = asRecord(response.body);
    const message =
      stringValue(body.error_description ?? body.message ?? body.error) ??
      'Falha na comunicação com a Efí.';
    throw new Error(message);
  }
  return asRecord(response.body);
}

async function accessToken(): Promise<string> {
  const baseUrl = pixBaseUrl();
  if (cachedToken && cachedToken.baseUrl === baseUrl && cachedToken.expiresAt > Date.now() + 60_000)
    return cachedToken.value;
  const { clientId, clientSecret } = credentials();
  const body = JSON.stringify({ grant_type: 'client_credentials' });
  const response = await httpsRequest(
    `${baseUrl}/oauth/token`,
    {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'content-type': 'application/json',
      },
      agent: createAgent(),
    },
    body,
  );
  const data = parseResponse(response);
  const token = stringValue(data.access_token);
  if (!token) throw new Error('A Efí não retornou um token de acesso.');
  const expiresIn = Number(data.expires_in ?? 3600);
  cachedToken = { value: token, expiresAt: Date.now() + Math.max(300, expiresIn) * 1000, baseUrl };
  return token;
}

async function request(path: string, init: RequestInit = {}): Promise<EfiRecord> {
  const token = await accessToken();
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${token}`);
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  const requestHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });
  const response = await httpsRequest(
    `${pixBaseUrl()}${path}`,
    {
      method: init.method ?? 'GET',
      headers: requestHeaders,
      agent: createAgent(),
    },
    typeof init.body === 'string' ? init.body : undefined,
  );
  if (response.status === 401) cachedToken = null;
  return parseResponse(response);
}

export type PixChargeResult = {
  txid: string;
  chargeId: string;
  qrCodeImage: string;
  pixCopiaECola: string;
};

export async function createPixCharge(input: {
  plan: PlanDefinition;
  userId: string;
}): Promise<PixChargeResult> {
  const charge = await request('/v2/cob', {
    method: 'POST',
    body: JSON.stringify({
      calendario: { expiracao: 3600 },
      valor: { original: (input.plan.priceCents / 100).toFixed(2) },
      chave: pixKey(),
      solicitacaoPagador: `Jornada Leve - Plano ${input.plan.name}`,
      infoAdicionais: [
        { nome: 'user_id', valor: input.userId },
        { nome: 'plano', valor: input.plan.code },
      ],
    }),
  });
  const txid = stringValue(charge.txid);
  const locationId = stringValue(asRecord(charge.loc).id);
  if (!txid || !locationId) throw new Error('A Efí não retornou os dados da cobrança PIX.');

  const qrCode = await request(`/v2/loc/${encodeURIComponent(locationId)}/qrcode`);
  const pixCopiaECola = stringValue(qrCode.qrcode);
  const qrCodeImage = stringValue(qrCode.imagemQrcode);
  if (!pixCopiaECola || !qrCodeImage) throw new Error('A Efí não retornou o QR Code PIX.');

  return { txid, chargeId: txid, qrCodeImage, pixCopiaECola };
}

export type NormalizedPixWebhook = {
  status: string;
  txid: string;
  eventId: string;
  amountCents: number | null;
};

export function normalizePixWebhook(payload: unknown): NormalizedPixWebhook | null {
  const root = asRecord(payload);
  const pixEntries = Array.isArray(root.pix) ? root.pix : [];
  const pix = asRecord(pixEntries[0] ?? root);
  const txid = stringValue(pix.txid ?? root.txid);
  if (!txid) return null;
  const status = (stringValue(root.status ?? pix.status) ?? 'CONCLUIDA').toUpperCase();
  const value = Number(pix.valor ?? root.valor);
  return {
    status,
    txid,
    eventId:
      stringValue(pix.endToEndId ?? pix.end_to_end_id ?? root.id) ??
      `${txid}:${stringValue(pix.horario) ?? status}`,
    amountCents: Number.isFinite(value) ? Math.round(value * 100) : null,
  };
}

export async function cancelEfiSubscription(subscriptionId: string) {
  return request(`/v2/subscription/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: 'POST',
    body: '{}',
  });
}

export async function getEfiSubscription(subscriptionId: string) {
  return request(`/v2/subscription/${encodeURIComponent(subscriptionId)}`);
}

export async function retryEfiSubscription(subscriptionId: string) {
  return request(`/v2/subscription/${encodeURIComponent(subscriptionId)}/retry`, {
    method: 'POST',
    body: '{}',
  });
}
