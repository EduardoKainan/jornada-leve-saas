import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSupabaseUrl } from './config.ts';

test('keeps a canonical Supabase project URL unchanged', () => {
  assert.equal(
    normalizeSupabaseUrl('https://example.supabase.co'),
    'https://example.supabase.co',
  );
});

test('removes REST API suffixes and trailing slashes from a Supabase URL', () => {
  assert.equal(
    normalizeSupabaseUrl('https://example.supabase.co/rest/v1/'),
    'https://example.supabase.co',
  );
  assert.equal(
    normalizeSupabaseUrl('https://example.supabase.co/rest/v1'),
    'https://example.supabase.co',
  );
});

test('rejects missing or invalid Supabase URLs without leaking credentials', () => {
  assert.throws(() => normalizeSupabaseUrl(undefined), /NEXT_PUBLIC_SUPABASE_URL/);
  assert.throws(() => normalizeSupabaseUrl('not-a-url'), /NEXT_PUBLIC_SUPABASE_URL/);
});
