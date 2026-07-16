// @ts-nocheck — Supabase dynamic table queries produce TS2590
import { sendEmail } from '@jornada-leve/email';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { unsubscribeUrl } from '@/lib/privacy-server';

const exportTables = [
  ['perfil', 'profiles', 'id, display_name, timezone, locale, onboarding_status, birth_adult_confirmed_at, height_cm, created_at, updated_at'],
  ['pesos', 'weight_entries', 'id, weight_kg, measured_at, source, created_at, updated_at'],
  ['medidas', 'measurement_entries', 'id, measurement_type, value_cm, custom_label, measured_at, created_at'],
  ['checkins', 'daily_checkins', 'id, checkin_date, hunger_level, energy_level, sleep_quality, activity_level, water_ml, encrypted_note, created_at, updated_at'],
  ['consentimentos', 'consent_records', 'id, consent_type, version, granted, source, created_at'],
  ['assinaturas', 'subscriptions', 'id, provider, plan_code, status, trial_ends_at, current_period_end, cancel_at_period_end, created_at, updated_at'],
] as const;

async function ensureExportBucket() {
  const admin = createAdminClient();
  const { data } = await admin.storage.getBucket('privacy-exports');
  if (data) return;
  const { error } = await admin.storage.createBucket('privacy-exports', { public: false, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ['application/json'] });
  if (error && !/already exists/i.test(error.message)) throw error;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const { data: privacyRequest, error: requestError } = await supabase.from('privacy_requests')
    .insert({ user_id: user.id, request_type: 'export', status: 'processing' })
    .select('id')
    .single();
  if (requestError || !privacyRequest) return NextResponse.json({ error: 'Não foi possível iniciar a exportação.' }, { status: 500 });
  try {
    // Build data manually to avoid TS2590 — dynamic table selects produce overly complex unions
    const sections: [string, unknown[]][] = [];

    const { data: profile } = await supabase.from('profiles').select('id, display_name, timezone, locale, onboarding_status, birth_adult_confirmed_at, height_cm, created_at, updated_at').eq('id', user.id).single();
    sections.push(['perfil', profile ? [profile] : []]);

    const { data: pesos } = await supabase.from('weight_entries').select('id, weight_kg, measured_at, source, created_at, updated_at').eq('user_id', user.id);
    sections.push(['pesos', pesos ?? []]);

    const { data: medidas } = await supabase.from('measurement_entries').select('id, measurement_type, value_cm, custom_label, measured_at, created_at').eq('user_id', user.id);
    sections.push(['medidas', medidas ?? []]);

    const { data: checkins } = await supabase.from('daily_checkins').select('id, checkin_date, hunger_level, energy_level, sleep_quality, activity_level, water_ml, created_at').eq('user_id', user.id);
    sections.push(['checkins', checkins ?? []]);

    const { data: consentimentos } = await supabase.from('consent_records').select('id, consent_type, version, granted, source, created_at').eq('user_id', user.id);
    sections.push(['consentimentos', consentimentos ?? []]);

    const { data: assinaturas } = await supabase.from('subscriptions').select('id, plan_code, status, trial_ends_at, current_period_end, cancel_at_period_end, created_at').eq('user_id', user.id);
    sections.push(['assinaturas', assinaturas ?? []]);
    const generatedAt = new Date();
    const payload = JSON.stringify({
      formato: 'Jornada Leve LGPD v1',
      titular: { id: user.id, email: user.email },
      geradoEm: generatedAt.toISOString(),
      dados: Object.fromEntries(sections),
    }, null, 2);
    const expiresAt = new Date(generatedAt.getTime() + 48 * 60 * 60 * 1000);
    const storagePath = `${user.id}/${privacyRequest.id}.json`;
    await ensureExportBucket();
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from('privacy-exports').upload(storagePath, payload, { contentType: 'application/json', upsert: false });
    if (uploadError) throw uploadError;
    const { data: signed, error: signedError } = await admin.storage.from('privacy-exports').createSignedUrl(storagePath, 48 * 60 * 60, { download: `jornada-leve-dados-${generatedAt.toISOString().slice(0, 10)}.json` });
    if (signedError || !signed?.signedUrl) throw signedError ?? new Error('Link de download não gerado.');
    await admin.from('privacy_requests').update({ status: 'ready', result_path: storagePath, expires_at: expiresAt.toISOString(), completed_at: generatedAt.toISOString() }).eq('id', privacyRequest.id);
    let emailed = false;
    if (process.env.RESEND_API_KEY) {
      const { error } = await sendEmail({
        to: user.email,
        template: 'privacy-export-ready',
        props: { actionUrl: signed.signedUrl, unsubscribeUrl: unsubscribeUrl(user.id, user.email) },
      });
      emailed = !error;
    }
    return NextResponse.json({ downloadUrl: signed.signedUrl, expiresAt: expiresAt.toISOString(), emailed });
  } catch {
    await createAdminClient().from('privacy_requests').update({ status: 'failed' }).eq('id', privacyRequest.id);
    return NextResponse.json({ error: 'Não foi possível gerar a exportação agora. O suporte poderá concluir a solicitação em até 48 horas.' }, { status: 500 });
  }
}
