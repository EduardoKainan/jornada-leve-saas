import type { PlanDefinition } from './sprint4';

const SANDBOX_URL = 'https://sandbox.efipay.com.br';
const PRODUCTION_URL = 'https://api.efipay.com.br';

type EfiRecord = Record<string, unknown>;

type CachedToken = { value: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

function asRecord(value: unknown): EfiRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as EfiRecord : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null;
}

function credentials() {
  const clientId = process.env.EFI_CLIENT_ID?.trim();
  const clientSecret = process.env.EFI_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error('Credenciais da Efí não configuradas.');
  return { clientId, clientSecret };
}

export function efiBaseUrl() {
  return process.env.EFI_SANDBOX?.toLowerCase() === 'false' ? PRODUCTION_URL : SANDBOX_URL;
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
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const { clientId, clientSecret } = credentials();
  const response = await fetch(`${efiBaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
    cache: 'no-store',
  });
  const data = await parseResponse(response);
  const token = stringValue(data.access_token);
  if (!token) throw new Error('A Efí não retornou um token de acesso.');
  const expiresIn = Number(data.expires_in ?? 3600);
  cachedToken = { value: token, expiresAt: Date.now() + Math.max(300, expiresIn) * 1000 };
  return token;
}

async function request(path: string, init: RequestInit = {}): Promise<EfiRecord> {
  const token = await accessToken();
  const response = await fetch(`${efiBaseUrl()}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });
  if (response.status === 401) cachedToken = null;
  return parseResponse(response);
}

function configuredPlanId(code: PlanDefinition['code']): string | null {
  const key = code === 'monthly' ? 'EFI_MONTHLY_PLAN_ID' : code === 'annual' ? 'EFI_ANNUAL_PLAN_ID' : null;
  return key ? process.env[key]?.trim() || null : null;
}

async function createProviderPlan(plan: PlanDefinition): Promise<string> {
  const configured = configuredPlanId(plan.code);
  if (configured) return configured;
  const data = await request('/v2/plan', {
    method: 'POST',
    body: JSON.stringify({
      name: `Jornada Leve ${plan.name}`,
      interval: plan.intervalDays,
      repeats: null,
    }),
  });
  const id = stringValue(data.plan_id ?? asRecord(data.data).plan_id ?? data.id);
  if (!id) throw new Error('A Efí não retornou o identificador do plano.');
  return id;
}

export type EfiSubscriptionResult = {
  subscriptionId: string;
  chargeId: string | null;
  checkoutUrl: string;
};

export async function createEfiSubscription(input: {
  plan: PlanDefinition;
  userId: string;
  name: string;
  email: string;
  callbackUrl: string;
}): Promise<EfiSubscriptionResult> {
  const planId = await createProviderPlan(input.plan);
  const response = await request(`/v2/plan/${encodeURIComponent(planId)}/subscribe`, {
    method: 'POST',
    body: JSON.stringify({
      external_reference: input.userId,
      customer: { name: input.name, email: input.email },
      redirect_url: input.callbackUrl,
    }),
  });
  const data = asRecord(response.data);
  const subscriptionId = stringValue(response.subscription_id ?? data.subscription_id ?? response.id);
  const chargeId = stringValue(response.charge_id ?? data.charge_id);
  const checkoutUrl = stringValue(response.checkout_url ?? response.payment_url ?? data.checkout_url ?? data.payment_url);
  if (!subscriptionId || !checkoutUrl) throw new Error('A Efí não retornou os dados do checkout.');
  return { subscriptionId, chargeId, checkoutUrl };
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
