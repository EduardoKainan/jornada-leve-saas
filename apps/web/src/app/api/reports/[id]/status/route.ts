import { NextResponse } from 'next/server';
import { getEffectiveReportStatus } from '@/lib/reports';
import { createClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const { data: report, error } = await supabase.from('report_jobs').select('id, status, expires_at').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível consultar o relatório.' }, { status: 500 });
  if (!report) return NextResponse.json({ error: 'Relatório não encontrado.' }, { status: 404 });
  return NextResponse.json({ id: report.id, status: getEffectiveReportStatus(report.status, report.expires_at), expiresAt: report.expires_at });
}
