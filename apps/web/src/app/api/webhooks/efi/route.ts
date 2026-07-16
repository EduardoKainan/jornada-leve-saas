import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { sendDunningEmail } from '@/lib/dunning-email';
import { dunningSchedule, normalizeEfiWebhook, PLANS, verifyEfiSignature } from '@/lib/sprint4';
import { createAdminClient } from '@/lib/supabase/admin';

const acceptedEvents = new Set(['charge_confirmed', 'charge_canceled', 'charge_failed', 'subscription_canceled']);

function eventStatus(type: string): string | null {
  if (type === 'charge_confirmed') return 'active';
  if (type === 'charge_failed') return 'past_due';
  if (type === 'charge_canceled' || type === 'subscription_canceled') return 'canceled';
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const secret = process.env.EFI_WEBHOOK_TOKEN?.trim();
  if (!secret) return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 503 });
  const signature = request.headers.get('x-signature') ?? request.headers.get('x-webhook-token');
  if (!verifyEfiSignature(rawBody, signature, secret)) {
    console.warn('[efi-webhook] assinatura inválida');
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  }

  const payload: unknown = JSON.parse(rawBody || 'null');
  const normalized = normalizeEfiWebhook(payload);
  const type = normalized.type.toLowerCase();
  if (!acceptedEvents.has(type)) return NextResponse.json({ received: true, ignored: true });
  const providerChargeId = normalized.chargeId ?? normalized.subscriptionId;
  if (!providerChargeId) return NextResponse.json({ error: 'Cobrança ausente no evento.' }, { status: 400 });

  const admin = createAdminClient();
  const payloadHash = createHash('sha256').update(rawBody).digest('hex');
  const rawEventId = normalized.eventId || payloadHash;
  const providerEventId = `${providerChargeId}:${rawEventId}`;
  const { data: existing } = await admin.from('payment_events').select('id').eq('provider_event_id', providerEventId).maybeSingle();
  if (existing) return NextResponse.json({ received: true, duplicate: true });

  const safeDetails = {
    status: type,
    amountCents: normalized.amountCents,
    paymentMethod: normalized.paymentMethod,
    cardLast4: normalized.cardLast4,
    chargeId: normalized.chargeId,
  };
  const { data: paymentEvent, error: insertError } = await admin.from('payment_events').insert({
    provider_event_id: providerEventId,
    event_type: type,
    signature_valid: true,
    payload_hash: payloadHash,
    outcome: JSON.stringify(safeDetails),
  }).select('id').single();
  if (insertError?.code === '23505') return NextResponse.json({ received: true, duplicate: true });
  if (insertError || !paymentEvent) return NextResponse.json({ error: 'Não foi possível registrar o evento.' }, { status: 500 });

  const { data: subscription } = await admin.from('subscriptions')
    .select('id, user_id, plan_code').eq('provider_subscription_id', providerChargeId).maybeSingle();
  if (!subscription) {
    await admin.from('payment_events').update({ processed_at: new Date().toISOString(), outcome: JSON.stringify({ ...safeDetails, processing: 'subscription_not_found' }) }).eq('id', paymentEvent.id);
    return NextResponse.json({ received: true, matched: false });
  }

  const status = eventStatus(type);
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (type === 'charge_confirmed') {
    const plan = PLANS.find((item) => item.code === subscription.plan_code);
    updates.current_period_end = new Date(Date.now() + (plan?.intervalDays ?? 30) * 86_400_000).toISOString();
    updates.cancel_at_period_end = false;
  }
  await admin.from('subscriptions').update(updates).eq('id', subscription.id);

  if (type === 'charge_failed') {
    const schedules = dunningSchedule();
    await admin.from('notification_jobs').upsert(schedules.map((scheduledAt, index) => ({
      user_id: subscription.user_id,
      event_type: 'dunning_retry',
      related_id: providerChargeId,
      scheduled_at: scheduledAt.toISOString(),
      channel: 'email',
      template_key: `dunning_retry_${index + 1}`,
      status: 'pending',
      idempotency_key: `dunning:${providerChargeId}:${rawEventId}:${index + 1}`,
    })), { onConflict: 'idempotency_key', ignoreDuplicates: true });
    const { data: authUser } = await admin.auth.admin.getUserById(subscription.user_id);
    if (authUser.user?.email) await sendDunningEmail(authUser.user.email, 'payment_failed');
  }

  await admin.from('payment_events').update({ processed_at: new Date().toISOString() }).eq('id', paymentEvent.id);
  console.info('[efi-webhook] evento processado', { type, matched: true });
  return NextResponse.json({ received: true });
}
