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

  if (certPath) {
    return new https.Agent({
      pfx: fs.readFileSync(certPath),
      passphrase: '',
    });
  }

  if (certB64) {
    return new https.Agent({
      pfx: Buffer.from(certB64, 'base64'),
      passphrase: '',
    });
  }

  return undefined;
}

function asRecord(value: unknown): EfiRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as EfiRecord : {};
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

async function parseResponse(response: Response): Promise<EfiRecord> {
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const body = asRecord(data);
    const message = stringValue(body.error_description ?? body.message ?? body.error) ?? 'Falha na comunicação com a Efí.';
    throw new Error(message);
  }
  return asRecord(data);
}

async function accessToken(): Promise<string> {
  const baseUrl = pixBaseUrl();
  if (cachedToken && cachedToken.baseUrl === baseUrl && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const { clientId, clientSecret } = credentials();
  const requestInit: RequestInit & { agent?: https.Agent } = {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
    cache: 'no-store',
    agent: createAgent(),
  };
  const response = await fetch(`${baseUrl}/oauth/token`, requestInit);
  const data = await parseResponse(response);
  const token = stringValue(data.access_token);
  if (!token) throw new Error('A Efí não retornou um token de acesso.');
  const expiresIn = Number(data.expires_in ?? 3600);
  cachedToken = { value: token, expiresAt: Date.now() + Math.max(300, expiresIn) * 1000, baseUrl };
  return token;
}

async function request(path: string, init: RequestInit = {}): Promise<EfiRecord> {
  const token = await accessToken();
  const requestInit: RequestInit & { agent?: https.Agent } = {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
    agent: createAgent(),
  };
  const response = await fetch(`${pixBaseUrl()}${path}`, requestInit);
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
    eventId: stringValue(pix.endToEndId ?? pix.end_to_end_id ?? root.id) ?? `${txid}:${stringValue(pix.horario) ?? status}`,
    amountCents: Number.isFinite(value) ? Math.round(value * 100) : null,
  };
}

export async function cancelEfiSubscription(subscriptionId: string) {
  return request(`/v2/subscription/${encodeURIComponent(subscriptionId)}/cancel`, { method: 'POST', body: '{}' });
}

export async function getEfiSubscription(subscriptionId: string) {
  return request(`/v2/subscription/${encodeURIComponent(subscriptionId)}`);
}

export async function retryEfiSubscription(subscriptionId: string) {
  return request(`/v2/subscription/${encodeURIComponent(subscriptionId)}/retry`, { method: 'POST', body: '{}' });
}
