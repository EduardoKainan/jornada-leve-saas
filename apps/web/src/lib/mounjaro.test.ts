import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  applicationSchema,
  buildApplicationSummary,
  decodeApplicationDetails,
  encodeApplicationDetails,
} from './mounjaro.ts';

const pagePath = new URL('../app/app/aplicacao/page.tsx', import.meta.url);
const navPath = new URL('../components/app/app-nav.tsx', import.meta.url);

test('valida os dados permitidos para uma aplicação', () => {
  const valid = applicationSchema.safeParse({
    applicationDate: '2026-07-16',
    dose: '7.5',
    location: 'coxa',
    symptoms: ['Náusea', 'Fadiga'],
    notes: 'Aplicação sem intercorrências.',
  });
  assert.equal(valid.success, true);
  assert.equal(
    applicationSchema.safeParse({
      applicationDate: '16/07/2026',
      dose: '3',
      location: 'costas',
      symptoms: [],
    }).success,
    false,
  );
  assert.equal(
    applicationSchema.safeParse({
      applicationDate: '2026-02-31',
      dose: '5',
      location: 'abdomen',
      symptoms: [],
      notes: '',
    }).success,
    false,
  );
  assert.equal(
    applicationSchema.safeParse({
      applicationDate: '2026-07-16',
      dose: '5',
      location: 'braco',
      symptoms: ['Nenhum', 'Fadiga'],
    }).success,
    false,
  );
});

test('codifica e recupera os detalhes armazenados no evento de rotina', () => {
  const details = {
    dose: '5' as const,
    location: 'abdomen' as const,
    symptoms: ['Nenhum' as const],
    notes: '',
  };
  assert.deepEqual(decodeApplicationDetails(encodeApplicationDetails(details)), details);
  assert.equal(decodeApplicationDetails('conteúdo inválido'), null);
});

test('resume o histórico usando a aplicação mais recente e intervalo semanal', () => {
  const summary = buildApplicationSummary(
    ['2026-07-09T12:00:00.000Z', '2026-07-02T12:00:00.000Z'],
    new Date('2026-07-16T12:00:00.000Z'),
  );
  assert.deepEqual(summary, { daysSinceLast: 7, nextApplicationDate: '2026-07-16', total: 2 });
  assert.deepEqual(buildApplicationSummary([], new Date('2026-07-16T12:00:00.000Z')), {
    daysSinceLast: null,
    nextApplicationDate: null,
    total: 0,
  });
});

test('a página e a navegação expõem o controle de aplicação', () => {
  const page = readFileSync(pagePath, 'utf8');
  const nav = readFileSync(navPath, 'utf8');
  for (const text of [
    'Controle de Aplicação',
    'Registre suas aplicações de Mounjaro',
    'Data da aplicação',
    'Registrar aplicação',
    'Nenhuma aplicação registrada ainda',
    'Ver todas',
  ]) {
    assert.match(page, new RegExp(text));
  }
  const foodIndex = nav.indexOf("label: 'Alimentação'");
  const applicationIndex = nav.indexOf("label: 'Aplicação'");
  const planIndex = nav.indexOf("label: 'Plano'");
  assert.ok(applicationIndex > foodIndex && applicationIndex < planIndex);
  assert.match(nav, /Syringe/);
});
