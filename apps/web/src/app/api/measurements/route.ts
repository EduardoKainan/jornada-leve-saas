import { NextResponse, type NextRequest } from 'next/server';
import { measurementSchema } from '@/lib/health';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const days = Math.min(3650, Math.max(1, Number(request.nextUrl.searchParams.get('days')) || 180));
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase.from('measurement_entries').select('id, measurement_type, value_cm, custom_label, measured_at, created_at').eq('user_id', user.id).gte('measured_at', since.toISOString()).order('measured_at', { ascending: true });
  if (error) return NextResponse.json({ error: 'Não foi possível carregar as medidas.' }, { status: 500 });
  return NextResponse.json({ measurements: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = measurementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  const { data, error } = await supabase.from('measurement_entries').insert({ user_id: user.id, measurement_type: parsed.data.measurementType, value_cm: parsed.data.valueCm, custom_label: parsed.data.measurementType === 'personalizada' ? parsed.data.customLabel : null, measured_at: new Date(parsed.data.measuredAt).toISOString() }).select('id, measurement_type, value_cm, custom_label, measured_at, created_at').single();
  if (error) return NextResponse.json({ error: 'Não foi possível registrar a medida.' }, { status: 500 });
  return NextResponse.json({ measurement: data }, { status: 201 });
}
