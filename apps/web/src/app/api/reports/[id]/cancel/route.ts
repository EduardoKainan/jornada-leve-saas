import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const { data, error } = await supabase.from('report_jobs').delete().eq('id', id).eq('user_id', user.id).eq('status', 'pending').select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível cancelar o relatório.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Só é possível cancelar um relatório pendente.' }, { status: 409 });
  return NextResponse.json({ id, status: 'cancelled' });
}
