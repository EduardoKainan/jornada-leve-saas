import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { getAppUrl, getPublicAuthRedirectUrl } from './app-url.ts';

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
});

test('uses configured public app origin', () => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.jornadaleve.com.br/algum-caminho';

  assert.equal(getAppUrl(), 'https://app.jornadaleve.com.br');
  assert.equal(
    getPublicAuthRedirectUrl(),
    'https://app.jornadaleve.com.br/auth/callback?next=/redefinir-senha',
  );
});

test('does not generate password recovery links to localhost', () => {
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

  assert.equal(getAppUrl(), 'http://localhost:3000');
  assert.equal(
    getPublicAuthRedirectUrl(),
    'https://jornadaleve.vercel.app/auth/callback?next=/redefinir-senha',
  );
});

test('falls back to production URL when configured app URL is invalid', () => {
  process.env.NEXT_PUBLIC_APP_URL = 'not-a-url';

  assert.equal(getAppUrl(), 'https://jornadaleve.vercel.app');
  assert.equal(
    getPublicAuthRedirectUrl(),
    'https://jornadaleve.vercel.app/auth/callback?next=/redefinir-senha',
  );
});
