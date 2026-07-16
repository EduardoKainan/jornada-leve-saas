import { NextResponse, type NextRequest } from 'next/server';
import { weightUpdateSchema } from '@/lib/health';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = weightUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  const { id } = await context.params;
  const updates: { weight_kg?: number; measured_at?: string; updated_at: string } = { updated_at: new Date().toISOString() };
  if (parsed.data.weightKg !== undefined) updates.weight_kg = parsed.data.weightKg;
  if (parsed.data.measuredAt !== undefined) updates.measured_at = new Date(parsed.data.measuredAt).toISOString();
  const { data, error } = await supabase.from('weight_entries').update(updates).eq('id', id).eq('user_id', user.id).select('id, weight_kg, measured_at, source, created_at').maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível atualizar o peso.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
  return NextResponse.json({ weight: data });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('weight_entries').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível excluir o peso.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
