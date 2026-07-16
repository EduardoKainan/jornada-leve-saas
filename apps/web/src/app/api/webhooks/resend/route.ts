import { NextResponse, type NextRequest } from 'next/server';
import { normalizeResendEvent, verifyResendWebhook } from '@/lib/resend-webhook';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: 'Webhook Resend não configurado.' }, { status: 503 });
  const payload = await request.text();
  const headers = {
    id: request.headers.get('svix-id') ?? '',
    timestamp: request.headers.get('svix-timestamp') ?? '',
    signature: request.headers.get('svix-signature') ?? '',
  };
  if (!verifyResendWebhook(payload, headers, secret)) return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  const event = normalizeResendEvent(JSON.parse(payload) as unknown);
  if (!event) return NextResponse.json({ received: true, ignored: true });

  const admin = createAdminClient();
  const { data: delivery, error: findError } = await admin.from('notification_deliveries')
    .select('id, job_id')
    .eq('provider_message_id', event.providerMessageId)
    .maybeSingle();
  if (findError) return NextResponse.json({ error: 'Falha ao localizar entrega.' }, { status: 500 });
  if (!delivery) return NextResponse.json({ received: true, matched: false });

  const update = event.status === 'delivered'
    ? { status: event.status, delivered_at: new Date().toISOString(), provider_error_code: null }
    : { status: event.status, provider_error_code: event.errorCode };
  const { error: updateError } = await admin.from('notification_deliveries').update(update).eq('id', delivery.id);
  if (updateError) return NextResponse.json({ error: 'Falha ao atualizar entrega.' }, { status: 500 });

  if (event.suppress) {
    const { data: job } = await admin.from('notification_jobs').select('user_id').eq('id', delivery.job_id).maybeSingle();
    if (job?.user_id) {
      await admin.from('notification_preferences').update({ enabled: false }).eq('user_id', job.user_id).eq('channel', 'email');
      await admin.from('audit_events').insert({
        actor_user_id: job.user_id,
        action: event.status === 'complained' ? 'email_complaint_unsubscribed' : 'email_bounce_suppressed',
        resource_type: 'notification_delivery',
        resource_id: delivery.id,
        reason_code: event.errorCode,
        metadata_redacted: { provider: 'resend', emailSuppressed: true },
      });
    }
  }
  return NextResponse.json({ received: true, matched: true });
}
