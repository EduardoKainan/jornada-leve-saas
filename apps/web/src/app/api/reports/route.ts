import { after, NextResponse, type NextRequest } from 'next/server';
import { generateReportPdf, getEffectiveReportStatus, reportRequestSchema, resolveReportPeriod } from '@/lib/reports';
import { createClient } from '@/lib/supabase/server';

const reportSelect = 'id, period_start, period_end, sections_json, status, expires_at, created_at';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const { data, error } = await supabase.from('report_jobs').select(reportSelect).eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os relatórios.' }, { status: 500 });
  return NextResponse.json({ reports: (data ?? []).map((report) => ({ ...report, status: getEffectiveReportStatus(report.status, report.expires_at) })) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = reportRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Configuração inválida.' }, { status: 400 });
  const { data: activeReports, error: activeError } = await supabase.from('report_jobs').select('id').eq('user_id', user.id).in('status', ['pending', 'processing']).limit(3);
  if (activeError) return NextResponse.json({ error: 'Não foi possível verificar os relatórios em andamento.' }, { status: 500 });
  if ((activeReports?.length ?? 0) >= 3) return NextResponse.json({ error: 'Aguarde a conclusão dos relatórios em andamento.' }, { status: 429 });
  const period = resolveReportPeriod(parsed.data.period);
  const { data: report, error } = await supabase.from('report_jobs').insert({
    user_id: user.id,
    period_start: period.start,
    period_end: period.end,
    sections_json: parsed.data.sections,
    status: 'pending',
  }).select(reportSelect).single();
  if (error || !report) return NextResponse.json({ error: 'Não foi possível iniciar o relatório.' }, { status: 500 });
  after(async () => {
    try { await generateReportPdf(user.id, report.id, parsed.data.sections, period); }
    catch (generationError) { console.error('Falha ao gerar relatório', report.id, generationError instanceof Error ? generationError.message : 'erro desconhecido'); }
  });
  return NextResponse.json({ report }, { status: 202 });
}
