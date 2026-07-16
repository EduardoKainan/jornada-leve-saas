import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return NextResponse.json({ error: 'Limpeza de relatórios não configurada.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const admin = createAdminClient();
  const { data: reports, error } = await admin.from('report_jobs').select('id, storage_path').eq('status', 'ready').not('storage_path', 'is', null).lte('expires_at', new Date().toISOString()).limit(100);
  if (error) return NextResponse.json({ error: 'Não foi possível consultar os relatórios expirados.' }, { status: 500 });
  let cleaned = 0;
  for (const report of reports ?? []) {
    if (!report.storage_path) continue;
    const { error: storageError } = await admin.storage.from('reports').remove([report.storage_path]);
    if (storageError && !/not found/i.test(storageError.message)) continue;
    const { error: updateError } = await admin.from('report_jobs').update({ storage_path: null }).eq('id', report.id);
    if (!updateError) cleaned += 1;
  }
  return NextResponse.json({ checked: reports?.length ?? 0, cleaned });
}
