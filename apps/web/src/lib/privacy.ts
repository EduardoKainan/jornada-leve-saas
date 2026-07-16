import { createHmac, timingSafeEqual } from 'node:crypto';

export type TokenPurpose = 'unsubscribe' | 'delete-account';
export type SignedTokenPayload = {
  purpose: TokenPurpose;
  userId: string;
  email?: string;
  requestId?: string;
  exp: number;
};

type TokenInput = Omit<SignedTokenPayload, 'exp'>;

function signature(value: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(value).digest();
}

export function createSignedToken(input: TokenInput, secret: string, now = new Date(), ttlSeconds = 48 * 60 * 60): string {
  if (secret.length < 32) throw new Error('O segredo de privacidade deve ter pelo menos 32 caracteres.');
  const payload: SignedTokenPayload = { ...input, exp: Math.floor(now.getTime() / 1000) + ttlSeconds };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${signature(encoded, secret).toString('base64url')}`;
}

export function readSignedToken(token: string, secret: string, expectedPurpose: TokenPurpose, now = new Date()): SignedTokenPayload | null {
  const [encoded, receivedSignature, extra] = token.split('.');
  if (!encoded || !receivedSignature || extra || secret.length < 32) return null;
  try {
    const expected = signature(encoded, secret);
    const received = Buffer.from(receivedSignature, 'base64url');
    if (received.byteLength !== expected.byteLength || !timingSafeEqual(received, expected)) return null;
    const parsed: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    const payload = parsed as Partial<SignedTokenPayload>;
    if (payload.purpose !== expectedPurpose || typeof payload.userId !== 'string' || typeof payload.exp !== 'number' || payload.exp < Math.floor(now.getTime() / 1000)) return null;
    return payload as SignedTokenPayload;
  } catch {
    return null;
  }
}

export function privacySecret(): string {
  const secret = process.env.PRIVACY_TOKEN_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error('PRIVACY_TOKEN_SECRET não está configurado com pelo menos 32 caracteres.');
  return secret;
}
