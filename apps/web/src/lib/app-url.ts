const DEFAULT_APP_URL = 'https://jornadaleve.com.br';

export function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) return DEFAULT_APP_URL;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return DEFAULT_APP_URL;
  }
}

export function getAppUrlWithoutTrailingSlash(): string {
  return getAppUrl().replace(/\/$/, '');
}
