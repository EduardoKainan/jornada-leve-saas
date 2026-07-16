import assert from 'node:assert/strict';
import test from 'node:test';
import { buildShareCardStats, formatWeightChange } from './share-card.ts';

test('calcula perda de peso, período inclusivo e sequência atual', () => {
  const stats = buildShareCardStats({
    firstWeight: { weight_kg: 82.4, measured_at: '2026-05-11T10:00:00.000Z' },
    latestWeight: { weight_kg: 77.2, measured_at: '2026-07-16T10:00:00.000Z' },
    checkinDates: ['2026-07-16', '2026-07-15', '2026-07-14', '2026-07-12'],
    totalCheckins: 4,
    totalReports: 3,
    now: new Date('2026-07-16T12:00:00.000Z'),
  });

  assert.deepEqual(stats, {
    weightChangeKg: -5.2,
    trackingDays: 67,
    streak: 3,
    totalCheckins: 4,
    totalReports: 3,
  });
  assert.equal(formatWeightChange(stats.weightChangeKg), '-5,2 kg');
});

test('usa valores neutros quando ainda não há registros de peso', () => {
  const stats = buildShareCardStats({
    firstWeight: null,
    latestWeight: null,
    checkinDates: [],
    totalCheckins: 0,
    totalReports: 0,
    now: new Date('2026-07-16T12:00:00.000Z'),
  });

  assert.equal(stats.weightChangeKg, null);
  assert.equal(stats.trackingDays, 0);
  assert.equal(stats.streak, 0);
  assert.equal(formatWeightChange(null), '—');
});
