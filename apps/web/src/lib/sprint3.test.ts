import assert from 'node:assert/strict';
import test from 'node:test';
import {
  accountProfileSchema,
  buildCalendarDays,
  calculateCheckinStreak,
  getNextReminderDelay,
  notificationPreferenceSchema,
} from './sprint3.ts';

test('builds a complete Monday-first calendar grid and marks records', () => {
  const days = buildCalendarDays(2026, 0, new Set(['2026-01-05']), new Map([['2026-01-05', 81.2]]), new Date('2026-01-10T12:00:00Z'));
  assert.equal(days.length % 7, 0);
  assert.equal(days[0]?.dateKey, '2025-12-29');
  const januaryFifth = days.find((day) => day.dateKey === '2026-01-05');
  assert.deepEqual(januaryFifth && { checkin: januaryFifth.hasCheckin, weight: januaryFifth.weightKg, future: januaryFifth.isFuture }, { checkin: true, weight: 81.2, future: false });
  assert.equal(days.find((day) => day.dateKey === '2026-01-11')?.isFuture, true);
});

test('calculates the current streak including yesterday when today is missing', () => {
  const now = new Date('2026-07-16T15:00:00Z');
  assert.equal(calculateCheckinStreak(['2026-07-15', '2026-07-14', '2026-07-13'], now), 3);
  assert.equal(calculateCheckinStreak(['2026-07-16', '2026-07-15', '2026-07-13'], now), 2);
  assert.equal(calculateCheckinStreak([], now), 0);
});

test('schedules the next enabled daily or weekday reminder', () => {
  const friday = new Date(2026, 6, 17, 9, 0, 0);
  assert.equal(getNextReminderDelay('10:00', 'daily', friday), 60 * 60 * 1000);
  const fridayAfter = new Date(2026, 6, 17, 11, 0, 0);
  assert.equal(getNextReminderDelay('10:00', 'weekdays', fridayAfter), 71 * 60 * 60 * 1000);
});

test('validates profile and notification preference payloads', () => {
  assert.equal(accountProfileSchema.safeParse({ displayName: 'Maria Silva', heightCm: 165 }).success, true);
  assert.equal(accountProfileSchema.safeParse({ displayName: '', heightCm: 90 }).success, false);
  assert.equal(notificationPreferenceSchema.safeParse({ enabled: true, localTime: '20:30', frequency: 'weekdays', timezone: 'America/Sao_Paulo' }).success, true);
  assert.equal(notificationPreferenceSchema.safeParse({ enabled: true, localTime: '25:00', frequency: 'sometimes', timezone: '' }).success, false);
});
