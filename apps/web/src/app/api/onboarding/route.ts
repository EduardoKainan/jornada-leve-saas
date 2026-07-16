import { NextResponse, type NextRequest } from 'next/server';
import { CONSENT_DOCUMENT_VERSION, onboardingSchema } from '@/lib/onboarding';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  const data = parsed.data;
  const now = new Date().toISOString();

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id, display_name: data.displayName, timezone: data.timezone, locale: 'pt-BR',
    onboarding_status: 'completed', birth_adult_confirmed_at: now, height_cm: data.heightCm ?? null, updated_at: now,
  });
  if (profileError) return NextResponse.json({ error: 'Não foi possível salvar seu perfil.' }, { status: 500 });

  const { data: existingGoal } = await supabase.from('user_goals').select('id').eq('user_id', user.id).is('archived_at', null).limit(1).maybeSingle();
  const goalResult = existingGoal
    ? await supabase.from('user_goals').update({ target_weight_kg: data.targetWeightKg }).eq('id', existingGoal.id)
    : await supabase.from('user_goals').insert({ user_id: user.id, target_weight_kg: data.targetWeightKg, start_date: now });
  if (goalResult.error) return NextResponse.json({ error: 'Perfil salvo, mas houve um erro ao salvar sua meta. Tente novamente.' }, { status: 500 });

  const { data: existingWeight } = await supabase.from('weight_entries').select('id').eq('user_id', user.id).eq('source', 'onboarding').limit(1).maybeSingle();
  const weightResult = existingWeight
    ? await supabase.from('weight_entries').update({ weight_kg: data.initialWeightKg, measured_at: now, updated_at: now }).eq('id', existingWeight.id)
    : await supabase.from('weight_entries').insert({ user_id: user.id, weight_kg: data.initialWeightKg, measured_at: now, source: 'onboarding' });
  if (weightResult.error) return NextResponse.json({ error: 'Perfil salvo, mas houve um erro ao salvar seu peso. Tente novamente.' }, { status: 500 });

  await supabase.from('consent_records').delete().eq('user_id', user.id).eq('source', 'onboarding').eq('version', CONSENT_DOCUMENT_VERSION);
  const consents = [
    { consent_type: 'terms', granted: data.termsAccepted },
    { consent_type: 'privacy', granted: data.privacyAccepted },
    { consent_type: 'sensitive_health_data', granted: data.sensitiveDataAccepted },
    { consent_type: 'marketing_email', granted: data.emailOptIn },
  ].map((consent) => ({ ...consent, user_id: user.id, version: CONSENT_DOCUMENT_VERSION, source: 'onboarding' }));
  const { data: savedConsents, error: consentError } = await supabase.from('consent_records').insert(consents).select('id, consent_type');
  if (consentError) return NextResponse.json({ error: 'Não foi possível registrar seus consentimentos.' }, { status: 500 });
  const emailConsentId = savedConsents?.find((item) => item.consent_type === 'marketing_email')?.id ?? null;
  const { error: preferenceError } = await supabase.from('notification_preferences').upsert({
    user_id: user.id, channel: 'email', type: 'weighing_reminder', enabled: data.emailOptIn,
    timezone: data.timezone, consent_record_id: emailConsentId, quiet_days: [],
  });
  if (preferenceError) return NextResponse.json({ error: 'Não foi possível salvar sua preferência de lembretes.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}