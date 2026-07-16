import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

const oneDecimal = (value: number) => Number.isInteger(value * 10);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const CHECKIN_RETROACTIVE_DAYS = 30;
export const ACTIVITY_LEVELS = ['nenhuma', 'leve', 'moderada', 'intensa'] as const;
export const MEASUREMENT_TYPES = ['cintura', 'abdomen', 'quadril', 'braco', 'coxa', 'personalizada'] as const;

export const checkinSchema = z.object({
  checkinDate: z.string().regex(datePattern, 'Informe uma data válida.'),
  hungerLevel: z.coerce.number().int().min(1).max(5).optional(),
  energyLevel: z.coerce.number().int().min(1).max(5).optional(),
  sleepQuality: z.coerce.number().int().min(1).max(5).optional(),
  activityLevel: z.enum(ACTIVITY_LEVELS).optional(),
  waterMl: z.coerce.number().int().min(0).max(15000).optional(),
  symptomIds: z.array(z.string().uuid()).max(30).default([]),
  note: z.string().trim().max(500, 'A observação deve ter no máximo 500 caracteres.').optional(),
});

export const weightSchema = z.object({
  weightKg: z.coerce.number().min(30, 'O peso mínimo é 30 kg.').max(350, 'O peso máximo é 350 kg.').refine(oneDecimal, 'Use no máximo uma casa decimal.'),
  measuredAt: z.string().datetime({ offset: true }).or(z.string().datetime({ local: true })),
});

export const measurementSchema = z.object({
  measurementType: z.enum(MEASUREMENT_TYPES),
  valueCm: z.coerce.number().positive().max(500).refine(oneDecimal, 'Use no máximo uma casa decimal.'),
  customLabel: z.string().trim().max(50).optional(),
  measuredAt: z.string().datetime({ offset: true }).or(z.string().datetime({ local: true })),
}).superRefine((value, context) => {
  if (value.measurementType === 'personalizada' && !value.customLabel) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['customLabel'], message: 'Informe o nome da medida.' });
  }
});

export const checkinUpdateSchema = checkinSchema.omit({ checkinDate: true }).partial();
export const weightUpdateSchema = weightSchema.partial().refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo.');

export function isAllowedCheckinDate(value: string, now = new Date()): boolean {
  if (!datePattern.test(value)) return false;
  const selected = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(selected.getTime())) return false;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const earliest = new Date(today);
  earliest.setUTCDate(earliest.getUTCDate() - CHECKIN_RETROACTIVE_DAYS);
  return selected >= earliest && selected <= today;
}

function encryptionKey(): Buffer {
  const secret = process.env.CHECKIN_NOTES_ENCRYPTION_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Chave de criptografia das observações não configurada.');
  return createHash('sha256').update(secret).digest();
}

export function encryptNote(note: string | undefined): string | null {
  if (!note?.trim()) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(note.trim(), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptNote(payload: string | null): string | null {
  if (!payload) return null;
  const [version, ivValue, tagValue, encryptedValue] = payload.split('.');
  if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
