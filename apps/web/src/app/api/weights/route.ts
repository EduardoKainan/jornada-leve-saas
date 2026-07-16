import { NextResponse, type NextRequest } from 'next/server';
import { weightSchema } from '@/lib/health';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const days = Math.min(3650, Math.max(1, Number(request.nextUrl.searchParams.get('days')) || 180));
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase.from('weight_entries').select('id, weight_kg, measured_at, source, created_at').eq('user_id', user.id).gte('measured_at', since.toISOString()).order('measured_at', { ascending: true });
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os pesos.' }, { status: 500 });
  return NextResponse.json({ weights: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = weightSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  const { data, error } = await supabase.from('weight_entries').insert({ user_id: user.id, weight_kg: parsed.data.weightKg, measured_at: new Date(parsed.data.measuredAt).toISOString(), source: 'manual' }).select('id, weight_kg, measured_at, source, created_at').single();
  if (error) return NextResponse.json({ error: 'Não foi possível registrar o peso.' }, { status: 500 });
  return NextResponse.json({ weight: data }, { status: 201 });
}
