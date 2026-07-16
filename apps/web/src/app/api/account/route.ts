import { NextResponse, type NextRequest } from 'next/server';
import { accountProfileSchema } from '@/lib/sprint3';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = accountProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  const { error } = await supabase.from('profiles').update({ display_name: parsed.data.displayName, height_cm: parsed.data.heightCm, updated_at: new Date().toISOString() }).eq('id', user.id);
  if (error) return NextResponse.json({ error: 'Não foi possível atualizar seu perfil.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || !('confirmation' in body) || body.confirmation !== 'EXCLUIR') return NextResponse.json({ error: 'Digite EXCLUIR para confirmar.' }, { status: 400 });
  try {
    const admin = createAdminClient();
    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteAuthError) return NextResponse.json({ error: 'Não foi possível excluir sua conta. Tente novamente.' }, { status: 500 });
    const { error: deleteProfileError } = await admin.from('profiles').delete().eq('id', user.id);
    if (deleteProfileError) return NextResponse.json({ error: 'Sua autenticação foi removida, mas a limpeza dos dados ficou pendente. Fale com o suporte.' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'A exclusão de conta não está configurada no servidor.' }, { status: 503 });
  }
}