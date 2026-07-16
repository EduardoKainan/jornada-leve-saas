const REST_API_SUFFIX = /\/rest\/v1\/?$/i;

/**
 * Supabase clients require the project root URL, not a REST endpoint URL.
 * Normalize here because exported shell variables override .env.local in Next.js.
 */
export function normalizeSupabaseUrl(value: string | undefined): string {
  if (!value) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não está configurada.');
  }

  const normalized = value.trim().replace(REST_API_SUFFIX, '').replace(/\/+$/, '');

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL é inválida.');
  }
}

export function getSupabaseUrl(): string {
  return normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não está configurada.');
  return key;
}
