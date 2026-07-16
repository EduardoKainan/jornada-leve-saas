import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createEfiCharge } from '@/lib/efi';
import { PLANS } from '@/lib/sprint4';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const requestSchema = z.object({ planCode: z.enum(['trial', 'monthly', 'annual']) });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });

  const plan = PLANS.find((item) => item.code === parsed.data.planCode);
  if (!plan) return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
  const admin = createAdminClient();
  const { data: current } = await admin.from('subscriptions').select('id, status, plan_code, provider_subscription_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (current && ['active', 'trialing', 'grace_period', 'canceled_end_of_period'].includes(current.status)) {
    return NextResponse.json({ error: 'Você já possui uma assinatura vigente.', subscription: current }, { status: 409 });
  }

  if (plan.code === 'trial') {
    const { data: previousTrial } = await admin.from('subscriptions').select('id')
      .eq('provider_subscription_id', `trial:${user.id}`).maybeSingle();
    if (previousTrial) return NextResponse.json({ error: 'O período gratuito já foi utilizado nesta conta.' }, { status: 409 });
    const trialEndsAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const { data, error } = await admin.from('subscriptions').insert({
      user_id: user.id,
      provider: 'efi',
      provider_subscription_id: `trial:${user.id}`,
      plan_code: 'trial',
      status: 'trialing',
      trial_ends_at: trialEndsAt,
      current_period_end: trialEndsAt,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    }).select('id, status, plan_code, trial_ends_at, current_period_end').single();
    if (error) return NextResponse.json({ error: 'Não foi possível iniciar seu período gratuito.' }, { status: 500 });
    return NextResponse.json({ subscription: data, checkoutUrl: null }, { status: 201 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || request.nextUrl.origin;
    const profileName = typeof user.user_metadata.display_name === 'string' ? user.user_metadata.display_name : null;
    const result = await createEfiCharge({
      plan,
      name: profileName?.trim() || user.email?.split('@')[0] || 'Cliente Jornada Leve',
      email: user.email || '',
      callbackUrl: `${appUrl}/app/cobranca?checkout=retorno`,
    });
    const { error } = await admin.from('subscriptions').insert({
      user_id: user.id,
      provider: 'efi',
      provider_subscription_id: result.chargeId,
      plan_code: plan.code,
      status: 'past_due',
      cancel_at_period_end: false,
    });
    if (error) throw new Error('Não foi possível salvar a assinatura.');
    return NextResponse.json({ checkoutUrl: result.checkoutUrl, chargeId: result.chargeId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível iniciar o checkout.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
