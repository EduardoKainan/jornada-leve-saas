import { NextResponse } from 'next/server';
import { getEffectiveReportStatus } from '@/lib/reports';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const { data: report, error } = await supabase.from('report_jobs').select('storage_path, status, expires_at, period_start, period_end').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível consultar o relatório.' }, { status: 500 });
  if (!report) return NextResponse.json({ error: 'Relatório não encontrado.' }, { status: 404 });
  const effectiveStatus = getEffectiveReportStatus(report.status, report.expires_at);
  if (effectiveStatus === 'expired') return NextResponse.json({ error: 'Este relatório expirou. Gere um novo.' }, { status: 410 });
  if (effectiveStatus !== 'ready' || !report.storage_path) return NextResponse.json({ error: 'O relatório ainda não está pronto.' }, { status: 409 });
  const admin = createAdminClient();
  const filename = `jornada-leve-${report.period_start}-${report.period_end}.pdf`;
  const { data, error: signedError } = await admin.storage.from('reports').createSignedUrl(report.storage_path, 3600, { download: filename });
  if (signedError || !data?.signedUrl) return NextResponse.json({ error: 'Não foi possível preparar o download.' }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
