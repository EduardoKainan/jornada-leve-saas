import { z } from 'zod';

export const envSchema = z.object({
  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Resend
  RESEND_API_KEY: z.string().min(1).optional(),

  // Efi
  EFI_CLIENT_ID: z.string().min(1).optional(),
  EFI_CLIENT_SECRET: z.string().min(1).optional(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(env: Record<string, string | undefined>): Env {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten());
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}
