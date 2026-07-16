import { NextResponse, type NextRequest } from 'next/server';
import { checkinUpdateSchema, decryptNote, encryptNote } from '@/lib/health';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };
const checkinSelect = 'id, checkin_date, hunger_level, energy_level, sleep_quality, activity_level, water_ml, encrypted_note, created_at, updated_at, checkin_symptoms(symptom_id, symptom_catalog(id, label_pt))';

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = checkinUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  const { id } = await context.params;
  const { data: existing } = await supabase.from('daily_checkins').select('id').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Check-in não encontrado.' }, { status: 404 });
  let encryptedNote: string | null | undefined;
  try { encryptedNote = parsed.data.note === undefined ? undefined : encryptNote(parsed.data.note); } catch { return NextResponse.json({ error: 'A criptografia das observações não está configurada.' }, { status: 500 }); }
  const updates: Record<string, string | number | null> = { updated_at: new Date().toISOString() };
  if (parsed.data.hungerLevel !== undefined) updates.hunger_level = parsed.data.hungerLevel;
  if (parsed.data.energyLevel !== undefined) updates.energy_level = parsed.data.energyLevel;
  if (parsed.data.sleepQuality !== undefined) updates.sleep_quality = parsed.data.sleepQuality;
  if (parsed.data.activityLevel !== undefined) updates.activity_level = parsed.data.activityLevel;
  if (parsed.data.waterMl !== undefined) updates.water_ml = parsed.data.waterMl;
  if (encryptedNote !== undefined) updates.encrypted_note = encryptedNote;
  const { error: updateError } = await supabase.from('daily_checkins').update(updates).eq('id', id).eq('user_id', user.id);
  if (updateError) return NextResponse.json({ error: 'Não foi possível atualizar o check-in.' }, { status: 500 });
  if (parsed.data.symptomIds !== undefined) {
    const { error: deleteError } = await supabase.from('checkin_symptoms').delete().eq('checkin_id', id);
    if (deleteError) return NextResponse.json({ error: 'Não foi possível atualizar os sintomas.' }, { status: 500 });
    if (parsed.data.symptomIds.length > 0) {
      const { error: insertError } = await supabase.from('checkin_symptoms').insert(parsed.data.symptomIds.map((symptomId) => ({ checkin_id: id, symptom_id: symptomId })));
      if (insertError) return NextResponse.json({ error: 'Não foi possível atualizar os sintomas.' }, { status: 500 });
    }
  }
  const { data, error } = await supabase.from('daily_checkins').select(checkinSelect).eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Check-in atualizado, mas não pôde ser recarregado.' }, { status: 500 });
  const { encrypted_note: encrypted, ...safe } = data;
  return NextResponse.json({ checkin: { ...safe, note: decryptNote(encrypted) } });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('daily_checkins').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível excluir o check-in.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Check-in não encontrado.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
