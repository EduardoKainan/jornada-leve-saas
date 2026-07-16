import { NextResponse, type NextRequest } from 'next/server';
import { checkinSchema, decryptNote, encryptNote, isAllowedCheckinDate } from '@/lib/health';
import { createClient } from '@/lib/supabase/server';

const checkinSelect = 'id, checkin_date, hunger_level, energy_level, sleep_quality, activity_level, water_ml, encrypted_note, created_at, updated_at, checkin_symptoms(symptom_id, symptom_catalog(id, label_pt))';

function serializeCheckin<T extends { encrypted_note: string | null }>(checkin: T) {
  const { encrypted_note: encryptedNote, ...safe } = checkin;
  return { ...safe, note: decryptNote(encryptedNote) };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const { data, error } = await supabase.from('daily_checkins').select(checkinSelect).eq('user_id', user.id).order('checkin_date', { ascending: false }).limit(90);
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os check-ins.' }, { status: 500 });
  try {
    return NextResponse.json({ checkins: (data ?? []).map(serializeCheckin) });
  } catch {
    return NextResponse.json({ error: 'Não foi possível descriptografar as observações.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = checkinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  if (!isAllowedCheckinDate(parsed.data.checkinDate)) return NextResponse.json({ error: 'Escolha uma data entre hoje e os últimos 30 dias.' }, { status: 400 });
  let encryptedNote: string | null;
  try { encryptedNote = encryptNote(parsed.data.note); } catch { return NextResponse.json({ error: 'A criptografia das observações não está configurada.' }, { status: 500 }); }
  const { data: checkin, error } = await supabase.from('daily_checkins').insert({
    user_id: user.id,
    checkin_date: parsed.data.checkinDate,
    hunger_level: parsed.data.hungerLevel ?? null,
    energy_level: parsed.data.energyLevel ?? null,
    sleep_quality: parsed.data.sleepQuality ?? null,
    activity_level: parsed.data.activityLevel ?? null,
    water_ml: parsed.data.waterMl ?? null,
    encrypted_note: encryptedNote,
  }).select('id').single();
  if (error?.code === '23505') return NextResponse.json({ error: 'Você já fez um check-in nesta data.' }, { status: 409 });
  if (error || !checkin) return NextResponse.json({ error: 'Não foi possível salvar o check-in.' }, { status: 500 });
  if (parsed.data.symptomIds.length > 0) {
    const { error: symptomsError } = await supabase.from('checkin_symptoms').insert(parsed.data.symptomIds.map((symptomId) => ({ checkin_id: checkin.id, symptom_id: symptomId })));
    if (symptomsError) {
      await supabase.from('daily_checkins').delete().eq('id', checkin.id).eq('user_id', user.id);
      return NextResponse.json({ error: 'Não foi possível salvar os sintomas.' }, { status: 500 });
    }
  }
  const { data: saved } = await supabase.from('daily_checkins').select(checkinSelect).eq('id', checkin.id).single();
  return NextResponse.json({ checkin: saved ? serializeCheckin(saved) : { id: checkin.id } }, { status: 201 });
}
