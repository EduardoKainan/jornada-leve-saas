import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ONBOARDING_STORAGE_KEY,
  onboardingSchema,
  sanitizeNextPath,
} from './onboarding.ts';

const validOnboarding = {
  adultConfirmed: true,
  displayName: 'Maria Silva',
  timezone: 'America/Sao_Paulo',
  initialWeightKg: 82.4,
  targetWeightKg: 70,
  heightCm: 165,
  termsAccepted: true,
  privacyAccepted: true,
  sensitiveDataAccepted: true,
  emailOptIn: false,
  weighingFrequency: 'weekly',
};

test('accepts a complete onboarding payload', () => {
  const result = onboardingSchema.safeParse(validOnboarding);
  assert.equal(result.success, true);
});

test('rejects onboarding without mandatory legal consents', () => {
  const result = onboardingSchema.safeParse({
    ...validOnboarding,
    sensitiveDataAccepted: false,
  });
  assert.equal(result.success, false);
});

test('keeps optional height empty and rejects an unsafe weight goal', () => {
  assert.equal(
    onboardingSchema.safeParse({ ...validOnboarding, heightCm: undefined }).success,
    true,
  );
  assert.equal(
    onboardingSchema.safeParse({ ...validOnboarding, targetWeightKg: 15 }).success,
    false,
  );
});

test('only accepts local redirect destinations', () => {
  assert.equal(sanitizeNextPath('/app/evolucao'), '/app/evolucao');
  assert.equal(sanitizeNextPath('https://malicioso.test'), '/app');
  assert.equal(sanitizeNextPath('//malicioso.test'), '/app');
  assert.equal(sanitizeNextPath(null), '/app');
});

test('uses a stable local storage key', () => {
  assert.equal(ONBOARDING_STORAGE_KEY, 'jornada-leve:onboarding:v1');
});
