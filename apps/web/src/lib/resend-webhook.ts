import { createHmac, timingSafeEqual } from 'node:crypto';

export type ResendWebhookHeaders = { id: string; timestamp: string; signature: string };
export type NormalizedResendEvent = {
  providerMessageId: string;
  status: 'delivered' | 'bounced' | 'complained';
  errorCode: string | null;
  suppress: boolean;
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
}

export function verifyResendWebhook(
  payload: string,
  headers: ResendWebhookHeaders,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const timestamp = Number(headers.timestamp);
  if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300 || !headers.id) return false;
  try {
    const key = Buffer.from(secret.trim().replace(/^whsec_/, ''), 'base64');
    if (key.byteLength === 0) return false;
    const expected = createHmac('sha256', key).update(`${headers.id}.${headers.timestamp}.${payload}`).digest();
    return headers.signature.split(' ').some((candidate) => {
      const [version, encoded] = candidate.split(',');
      if (version !== 'v1' || !encoded) return false;
      const received = Buffer.from(encoded, 'base64');
      return received.byteLength === expected.byteLength && timingSafeEqual(received, expected);
    });
  } catch {
    return false;
  }
}

export function normalizeResendEvent(payload: unknown): NormalizedResendEvent | null {
  const root = record(payload);
  const data = record(root?.data);
  const type = typeof root?.type === 'string' ? root.type : '';
  const providerMessageId = typeof data?.email_id === 'string' ? data.email_id : '';
  if (!providerMessageId) return null;
  if (type === 'email.delivered') return { providerMessageId, status: 'delivered', errorCode: null, suppress: false };
  if (type === 'email.complained') return { providerMessageId, status: 'complained', errorCode: 'complaint', suppress: true };
  if (type === 'email.bounced') {
    const bounce = record(data?.bounce);
    return {
      providerMessageId,
      status: 'bounced',
      errorCode: typeof bounce?.type === 'string' ? bounce.type : 'bounce',
      suppress: true,
    };
  }
  return null;
}
