import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkinSchema,
  measurementSchema,
  weightSchema,
  isAllowedCheckinDate,
  encryptNote,
  decryptNote,
} from './health.ts';

const today = '2026-07-16';

test('accepts a complete daily check-in', () => {
  const result = checkinSchema.safeParse({
    checkinDate: today,
    hungerLevel: 3,
    energyLevel: 4,
    sleepQuality: 2,
    activityLevel: 'moderada',
    waterMl: 1800,
    symptomIds: ['c3b9f026-79c5-413f-af22-728cc1f01967'],
    note: 'Dia tranquilo.',
  });
  assert.equal(result.success, true);
});

test('rejects invalid check-in scales and notes over 500 characters', () => {
  assert.equal(checkinSchema.safeParse({ checkinDate: today, hungerLevel: 0 }).success, false);
  assert.equal(checkinSchema.safeParse({ checkinDate: today, note: 'a'.repeat(501) }).success, false);
});

test('limits retroactive check-ins to 30 days and rejects future dates', () => {
  const now = new Date('2026-07-16T15:00:00Z');
  assert.equal(isAllowedCheckinDate('2026-06-16', now), true);
  assert.equal(isAllowedCheckinDate('2026-06-15', now), false);
  assert.equal(isAllowedCheckinDate('2026-07-17', now), false);
});

test('accepts weights from 30 to 350 kg with one decimal place', () => {
  assert.equal(weightSchema.safeParse({ weightKg: 30, measuredAt: '2026-07-16T08:30' }).success, true);
  assert.equal(weightSchema.safeParse({ weightKg: 350.1, measuredAt: '2026-07-16T08:30' }).success, false);
  assert.equal(weightSchema.safeParse({ weightKg: 80.25, measuredAt: '2026-07-16T08:30' }).success, false);
});

test('requires a label only for custom measurements', () => {
  assert.equal(measurementSchema.safeParse({ measurementType: 'cintura', valueCm: 92.5, measuredAt: '2026-07-16T08:30' }).success, true);
  assert.equal(measurementSchema.safeParse({ measurementType: 'personalizada', valueCm: 20, measuredAt: '2026-07-16T08:30' }).success, false);
  assert.equal(measurementSchema.safeParse({ measurementType: 'personalizada', customLabel: 'Panturrilha', valueCm: 38, measuredAt: '2026-07-16T08:30' }).success, true);
});

test('encrypts check-in notes and rejects a tampered payload', () => {
  process.env.CHECKIN_NOTES_ENCRYPTION_KEY = 'test-only-key-with-at-least-32-characters';
  const encrypted = encryptNote('Observação privada');
  assert.ok(encrypted);
  assert.notEqual(encrypted, 'Observação privada');
  assert.equal(decryptNote(encrypted), 'Observação privada');
  assert.equal(decryptNote(`${encrypted}alterado`), null);
  delete process.env.CHECKIN_NOTES_ENCRYPTION_KEY;
});
