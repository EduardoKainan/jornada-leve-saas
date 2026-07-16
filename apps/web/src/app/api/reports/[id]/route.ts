import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const { data: report, error: findError } = await supabase.from('report_jobs').select('id, storage_path, status').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (findError) return NextResponse.json({ error: 'Não foi possível consultar o relatório.' }, { status: 500 });
  if (!report) return NextResponse.json({ error: 'Relatório não encontrado.' }, { status: 404 });
  if (report.status === 'pending' || report.status === 'processing') return NextResponse.json({ error: 'Cancele ou aguarde a geração antes de excluir.' }, { status: 409 });
  if (report.storage_path) {
    const admin = createAdminClient();
    const { error: storageError } = await admin.storage.from('reports').remove([report.storage_path]);
    if (storageError && !/not found/i.test(storageError.message)) return NextResponse.json({ error: 'Não foi possível excluir o arquivo.' }, { status: 500 });
  }
  const { error } = await supabase.from('report_jobs').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Não foi possível excluir o relatório.' }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
