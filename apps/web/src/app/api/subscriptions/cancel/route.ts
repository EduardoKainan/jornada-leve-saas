import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { cancelEfiSubscription } from '@/lib/efi';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({ confirmation: z.literal('CANCELAR') });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Confirme o cancelamento digitando CANCELAR.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: subscription } = await admin.from('subscriptions').select('id, provider_subscription_id, status')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!subscription) return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 });
  if (subscription.status === 'canceled') return NextResponse.json({ ok: true });

  try {
    if (!subscription.provider_subscription_id.startsWith('trial:')) await cancelEfiSubscription(subscription.provider_subscription_id);
    const { error } = await admin.from('subscriptions').update({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() }).eq('id', subscription.id);
    if (error) throw new Error('Falha ao atualizar a assinatura.');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível cancelar.' }, { status: 502 });
  }
}
