import { expect, test, type Page } from '@playwright/test';

const account = { email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD };

async function login(page: Page) {
  test.skip(!account.email || !account.password, 'Defina E2E_EMAIL e E2E_PASSWORD com uma conta de teste já onboarded.');
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(account.email!);
  await page.getByLabel('Senha').fill(account.password!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/app(?:\/|\?|$)/);
}

test('landing → cadastro → onboarding → dashboard', async ({ page }) => {
  test.skip(process.env.E2E_RUN_SIGNUP !== 'true', 'Defina E2E_RUN_SIGNUP=true para autorizar a criação de uma conta descartável.');
  const email = `e2e+${Date.now()}@example.com`;
  await page.goto('/');
  await page.getByRole('link', { name: /Começar grátis/ }).first().click();
  await page.getByLabel('Como podemos chamar você?').fill('Teste E2E');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('Teste-E2E-2026!');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel(/Tenho 18 anos ou mais/).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Peso atual (kg)').fill('80');
  await page.getByLabel('Meta de peso (kg)').fill('70');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Prefiro não informar' }).click();
  await page.getByLabel(/Termos de uso/).check();
  await page.getByLabel(/Política de privacidade/).check();
  await page.getByLabel(/Tratamento de dados de saúde/).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Concluir' }).click();
  await expect(page).toHaveURL(/\/app(?:\?|$)/);
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('login → registrar peso → ver evolução em gráfico', async ({ page }) => {
  await login(page);
  await page.goto('/app/peso');
  const value = (75 + Math.random() * 2).toFixed(1);
  await page.getByLabel('Peso (kg)').fill(value);
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await expect(page.getByText('Peso registrado.')).toBeVisible();
  await expect(page.getByText(`${value.replace('.', ',')} kg`).first()).toBeVisible();
  await page.goto('/app/evolucao');
  await expect(page.getByRole('heading', { name: /Evolução/ })).toBeVisible();
  await expect(page.locator('.recharts-responsive-container').first()).toBeVisible();
});

test('plano → assinar → cobrança', async ({ page }) => {
  await login(page);
  await page.route('**/api/subscriptions', async (route) => {
    if (route.request().method() === 'POST') await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ checkoutUrl: '/app/cobranca' }) });
    else await route.continue();
  });
  await page.goto('/app/plano');
  await expect(page.getByRole('heading', { name: 'Escolha seu plano' })).toBeVisible();
  await page.getByRole('button', { name: 'Assinar' }).first().click();
  await expect(page).toHaveURL(/\/app\/cobranca/);
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('relatório → configurar → gerar → baixar', async ({ page }) => {
  await login(page);
  await page.goto('/app/relatorios');
  await page.getByRole('button', { name: /Novo relatório|Criar primeiro relatório/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Gerar relatório' }).click();
  const downloadLink = page.getByRole('link', { name: 'Baixar' }).first();
  await expect(downloadLink).toBeVisible({ timeout: 45_000 });
  const downloadPromise = page.waitForEvent('download');
  await downloadLink.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});
