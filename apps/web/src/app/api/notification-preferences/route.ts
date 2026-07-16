import { NextResponse, type NextRequest } from 'next/server';
import { notificationPreferenceSchema } from '@/lib/sprint3';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = notificationPreferenceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Preferência inválida.' }, { status: 400 });
  const { data: existing } = await supabase.from('notification_preferences').select('consent_record_id').eq('user_id', user.id).eq('channel', 'browser').eq('type', 'daily_checkin').maybeSingle();
  let consentRecordId = existing?.consent_record_id ?? null;
  if (parsed.data.enabled && !consentRecordId) {
    const { data: consent } = await supabase.from('consent_records').insert({ user_id: user.id, consent_type: 'browser_notifications', version: '1.0', granted: true, source: 'account' }).select('id').single();
    consentRecordId = consent?.id ?? null;
  }
  const { error } = await supabase.from('notification_preferences').upsert({
    user_id: user.id,
    channel: 'browser',
    type: 'daily_checkin',
    enabled: parsed.data.enabled,
    local_time: `${parsed.data.localTime}:00`,
    quiet_days: parsed.data.frequency === 'weekdays' ? ['0', '6'] : [],
    timezone: parsed.data.timezone,
    consent_record_id: consentRecordId,
  }, { onConflict: 'user_id,channel,type' });
  if (error) return NextResponse.json({ error: 'Não foi possível salvar seus lembretes.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}