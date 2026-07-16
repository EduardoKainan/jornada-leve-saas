import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const { data, error } = await supabase.from('symptom_catalog').select('id, code, label_pt').eq('active', true).order('sort_order');
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os sintomas.' }, { status: 500 });
  return NextResponse.json({ symptoms: data ?? [] });
}
