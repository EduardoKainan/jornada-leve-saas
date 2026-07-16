import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { normalizePixWebhook } from '@/lib/efi';
import { PLANS, verifyEfiSignature } from '@/lib/sprint4';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const secret = process.env.EFI_WEBHOOK_TOKEN?.trim();
  if (!secret) return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 503 });

  const headerSignature = request.headers.get('x-signature') ?? request.headers.get('x-webhook-token');
  const queryToken = request.nextUrl.searchParams.get('token');
  if (!verifyEfiSignature(rawBody, headerSignature ?? queryToken, secret)) {
    console.warn('[efi-pix-webhook] autenticação inválida');
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody || 'null');
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const pix = normalizePixWebhook(payload);
  if (!pix) return NextResponse.json({ received: true, ignored: true });
  if (pix.status !== 'CONCLUIDA') return NextResponse.json({ received: true, ignored: true, status: pix.status });

  const admin = createAdminClient();
  const payloadHash = createHash('sha256').update(rawBody).digest('hex');
  const providerEventId = `${pix.txid}:${pix.eventId}`;
  const { data: existing } = await admin.from('payment_events').select('id').eq('provider_event_id', providerEventId).maybeSingle();
  if (existing) return NextResponse.json({ received: true, duplicate: true });

  const outcome = {
    status: pix.status,
    amountCents: pix.amountCents,
    paymentMethod: 'pix',
    chargeId: pix.txid,
  };
  const { data: paymentEvent, error: insertError } = await admin.from('payment_events').insert({
    provider_event_id: providerEventId,
    event_type: 'pix_received',
    signature_valid: true,
    payload_hash: payloadHash,
    outcome: JSON.stringify(outcome),
  }).select('id').single();
  if (insertError?.code === '23505') return NextResponse.json({ received: true, duplicate: true });
  if (insertError || !paymentEvent) return NextResponse.json({ error: 'Não foi possível registrar o evento.' }, { status: 500 });

  const { data: subscription } = await admin.from('subscriptions')
    .select('id, plan_code').eq('provider_subscription_id', pix.txid).maybeSingle();
  if (!subscription) {
    await admin.from('payment_events').update({
      processed_at: new Date().toISOString(),
      outcome: JSON.stringify({ ...outcome, processing: 'subscription_not_found' }),
    }).eq('id', paymentEvent.id);
    return NextResponse.json({ received: true, matched: false });
  }

  const plan = PLANS.find((item) => item.code === subscription.plan_code);
  const now = new Date();
  const { error: updateError } = await admin.from('subscriptions').update({
    status: 'active',
    current_period_end: new Date(now.getTime() + (plan?.intervalDays ?? 30) * 86_400_000).toISOString(),
    cancel_at_period_end: false,
    updated_at: now.toISOString(),
  }).eq('id', subscription.id);
  if (updateError) return NextResponse.json({ error: 'Não foi possível ativar a assinatura.' }, { status: 500 });

  await admin.from('payment_events').update({ processed_at: now.toISOString() }).eq('id', paymentEvent.id);
  console.info('[efi-pix-webhook] pagamento confirmado', { txid: pix.txid });
  return NextResponse.json({ received: true, activated: true });
}
