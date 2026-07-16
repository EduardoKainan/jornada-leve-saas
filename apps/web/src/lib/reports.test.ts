import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getEffectiveReportStatus,
  reportRequestSchema,
  resolveReportPeriod,
} from './reports.ts';

test('resolve os períodos rápidos usando datas inclusivas', () => {
  const now = new Date('2026-07-16T12:00:00.000Z');
  assert.deepEqual(resolveReportPeriod({ preset: '7d' }, now), {
    start: '2026-07-10',
    end: '2026-07-16',
  });
  assert.deepEqual(resolveReportPeriod({ preset: '30d' }, now), {
    start: '2026-06-17',
    end: '2026-07-16',
  });
});

test('aceita período personalizado válido e rejeita intervalo invertido', () => {
  assert.deepEqual(
    resolveReportPeriod({ preset: 'custom', start: '2026-05-01', end: '2026-05-31' }),
    { start: '2026-05-01', end: '2026-05-31' },
  );
  assert.throws(
    () => resolveReportPeriod({ preset: 'custom', start: '2026-05-31', end: '2026-05-01' }),
    /data inicial/i,
  );
});

test('valida solicitação exigindo pelo menos uma seção e datas válidas', () => {
  assert.equal(reportRequestSchema.safeParse({ period: { preset: '90d' }, sections: ['weight', 'checkins'] }).success, true);
  assert.equal(reportRequestSchema.safeParse({ period: { preset: '7d' }, sections: [] }).success, false);
  assert.equal(reportRequestSchema.safeParse({ period: { preset: 'custom', start: '16/07/2026', end: '2026-07-16' }, sections: ['weight'] }).success, false);
  assert.equal(reportRequestSchema.safeParse({ period: { preset: 'custom', start: '2026-02-31', end: '2026-03-05' }, sections: ['weight'] }).success, false);
  assert.equal(reportRequestSchema.safeParse({ period: { preset: 'custom', start: '2025-01-01', end: '2026-01-02' }, sections: ['weight'] }).success, false);
});

test('marca relatório pronto vencido como expirado sem alterar outros estados', () => {
  const now = new Date('2026-07-16T12:00:00.000Z');
  assert.equal(getEffectiveReportStatus('ready', '2026-07-15T12:00:00.000Z', now), 'expired');
  assert.equal(getEffectiveReportStatus('ready', '2026-07-17T12:00:00.000Z', now), 'ready');
  assert.equal(getEffectiveReportStatus('processing', '2026-07-15T12:00:00.000Z', now), 'processing');
});
