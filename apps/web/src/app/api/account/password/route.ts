import { NextResponse, type NextRequest } from 'next/server';
import { passwordSchema } from '@/lib/sprint3';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = passwordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Senha inválida.' }, { status: 400 });
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return NextResponse.json({ error: 'Não foi possível alterar a senha. Faça login novamente e tente de novo.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}