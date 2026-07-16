import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from './config';

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada.');

  return createClient(
    getSupabaseUrl(),
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}