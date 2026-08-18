const DEFAULT_APP_URL = 'https://jornadaleve.vercel.app';

function parseOrigin(value?: string | null) {
  if (!value?.trim()) return null;

  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string) {
  const hostname = new URL(origin).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

export function getAppUrl(): string {
  return parseOrigin(process.env.NEXT_PUBLIC_APP_URL) ?? DEFAULT_APP_URL;
}

export function getPublicAuthRedirectUrl(): string {
  const configuredOrigin = getAppUrl();
  const redirectOrigin = isLocalOrigin(configuredOrigin) ? DEFAULT_APP_URL : configuredOrigin;
  return `${redirectOrigin}/auth/callback?next=/redefinir-senha`;
}

export function getAppUrlWithoutTrailingSlash(): string {
  return getAppUrl().replace(/\/$/, '');
}
