import { z } from 'zod';

export const MOUNJARO_PLAN_NAME = 'Mounjaro';
export const MOUNJARO_DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'] as const;
export const APPLICATION_LOCATIONS = ['abdomen', 'coxa', 'braco'] as const;
export const APPLICATION_SYMPTOMS = [
  'Náusea',
  'Fadiga',
  'Dor de cabeça',
  'Diarreia',
  'Constipação',
  'Tontura',
  'Nenhum',
] as const;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const applicationDetailsSchema = z.object({
  dose: z.enum(MOUNJARO_DOSES),
  location: z.enum(APPLICATION_LOCATIONS),
  symptoms: z.array(z.enum(APPLICATION_SYMPTOMS)).max(APPLICATION_SYMPTOMS.length),
  notes: z
    .string()
    .trim()
    .max(1000, 'As observações devem ter no máximo 1000 caracteres.')
    .default(''),
});

export const applicationSchema = applicationDetailsSchema
  .extend({
    applicationDate: z.string().regex(datePattern, 'Informe uma data válida.'),
  })
  .superRefine((value, context) => {
    const selected = new Date(`${value.applicationDate}T12:00:00Z`);
    if (
      Number.isNaN(selected.getTime()) ||
      selected.toISOString().slice(0, 10) !== value.applicationDate
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applicationDate'],
        message: 'Informe uma data válida.',
      });
    }
    if (value.symptoms.includes('Nenhum') && value.symptoms.length > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['symptoms'],
        message: '“Nenhum” não pode ser combinado com outros sintomas.',
      });
    }
  });

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ApplicationDetails = z.infer<typeof applicationDetailsSchema>;

export type ApplicationSummary = {
  daysSinceLast: number | null;
  nextApplicationDate: string | null;
  total: number;
};

export function encodeApplicationDetails(details: ApplicationDetails): string {
  return JSON.stringify(applicationDetailsSchema.parse(details));
}

export function decodeApplicationDetails(value: string | null): ApplicationDetails | null {
  if (!value) return null;
  try {
    const parsed = applicationDetailsSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function utcDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function dateKeyFromTimestamp(value: string): string | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : utcDateKey(parsed);
}

export function buildApplicationSummary(
  scheduledDates: readonly string[],
  now = new Date(),
): ApplicationSummary {
  const validDates = scheduledDates
    .map(dateKeyFromTimestamp)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a));
  const lastDate = validDates[0];
  if (!lastDate)
    return { daysSinceLast: null, nextApplicationDate: null, total: scheduledDates.length };

  const today = new Date(`${utcDateKey(now)}T12:00:00Z`);
  const last = new Date(`${lastDate}T12:00:00Z`);
  const millisecondsPerDay = 86_400_000;
  const daysSinceLast = Math.max(
    0,
    Math.floor((today.getTime() - last.getTime()) / millisecondsPerDay),
  );
  const next = new Date(last);
  next.setUTCDate(next.getUTCDate() + 7);

  return { daysSinceLast, nextApplicationDate: utcDateKey(next), total: scheduledDates.length };
}
