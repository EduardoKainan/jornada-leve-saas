import { z } from 'zod';

export const ONBOARDING_STORAGE_KEY = 'jornada-leve:onboarding:v1';
export const CONSENT_DOCUMENT_VERSION = '2026-07-01';

export const onboardingSchema = z.object({
  adultConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Confirme que você tem 18 anos ou mais.' }),
  }),
  displayName: z.string().trim().min(2, 'Informe seu nome.').max(100),
  timezone: z.string().trim().min(1, 'Informe seu fuso horário.').max(100),
  initialWeightKg: z.coerce.number().min(30).max(350),
  targetWeightKg: z.coerce.number().min(30).max(350),
  heightCm: z.coerce.number().min(100).max(250).optional(),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  sensitiveDataAccepted: z.literal(true),
  emailOptIn: z.boolean(),
  weighingFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
export type OnboardingDraft = Partial<OnboardingData>;

export function sanitizeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/app';
  return value;
}
