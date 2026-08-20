import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type PromoteBody = { email?: string };

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function requestedToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') ?? '';
  if (authorization.toLowerCase().startsWith('bearer ')) return authorization.slice(7).trim();
  return request.headers.get('x-bootstrap-token')?.trim() ?? '';
}

export async function POST(request: NextRequest) {
  const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN?.trim();
  if (!bootstrapToken) {
    return NextResponse.json({ error: 'Bootstrap administrativo desativado.' }, { status: 404 });
  }

  const token = requestedToken(request);
  if (!token || !safeEqual(token, bootstrapToken)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as PromoteBody;
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório.' }, { status: 400 });

  const service = createAdminClient();
  let targetUser: { id: string; email?: string } | null = null;

  for (let page = 1; page <= 20 && !targetUser; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return NextResponse.json({ error: 'Não foi possível listar usuários.' }, { status: 502 });

    targetUser = data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
    if (data.users.length < 100) break;
  }

  if (!targetUser) return NextResponse.json({ error: 'Usuário não encontrado no Supabase Auth.' }, { status: 404 });

  const { data: admin, error: upsertError } = await service
    .from('admin_users')
    .upsert({
      auth_user_id: targetUser.id,
      role: 'super_admin',
      active: true,
      mfa_required: true,
    }, { onConflict: 'auth_user_id' })
    .select('auth_user_id, role, active, mfa_required')
    .single();

  if (upsertError) {
    return NextResponse.json({ error: 'Não foi possível promover o usuário.' }, { status: 500 });
  }

  await service.from('audit_events').insert({
    actor_user_id: targetUser.id,
    action: 'promote_super_admin',
    resource_type: 'admin_users',
    resource_id: targetUser.id,
    reason_code: 'owner_request',
    metadata_redacted: { email },
  });

  return NextResponse.json({ admin });
}
