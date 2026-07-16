import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pagePath = new URL('../app/app/alimentacao/page.tsx', import.meta.url);
const navPath = new URL('../components/app/app-nav.tsx', import.meta.url);

test('a página de alimentação apresenta as seis categorias e o aviso profissional', () => {
  const source = readFileSync(pagePath, 'utf8');
  const categories = [
    'Café da manhã leve',
    'Almoço equilibrado',
    'Hidratação',
    'Lanches inteligentes',
    'Jantar sem culpa',
    'O que evitar',
  ];

  assert.match(source, /Dicas de Alimentação/);
  for (const category of categories) assert.match(source, new RegExp(category));
  assert.match(source, /Consulte seu nutricionista para um plano alimentar adequado ao seu tratamento\./);
});

test('a navegação posiciona Alimentação entre Relatórios e Plano', () => {
  const source = readFileSync(navPath, 'utf8');
  const reportsIndex = source.indexOf("label: 'Relatórios'");
  const foodIndex = source.indexOf("label: 'Alimentação'");
  const planIndex = source.indexOf("label: 'Plano'");

  assert.ok(reportsIndex >= 0);
  assert.ok(foodIndex > reportsIndex);
  assert.ok(planIndex > foodIndex);
  assert.match(source, /href: '\/app\/alimentacao'/);
});
