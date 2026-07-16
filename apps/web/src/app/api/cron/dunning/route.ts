import { NextResponse, type NextRequest } from 'next/server';
import { cancelEfiSubscription, getEfiSubscription, retryEfiSubscription } from '@/lib/efi';
import { sendDunningEmail } from '@/lib/dunning-email';
import { createAdminClient } from '@/lib/supabase/admin';

type ProviderStatus = { status?: unknown; data?: { status?: unknown } };

function statusFrom(value: unknown): string {
  const body = value as ProviderStatus;
  const status = body?.status ?? body?.data?.status;
  return typeof status === 'string' ? status.toLowerCase() : '';
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return NextResponse.json({ error: 'Dunning não configurado.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const admin = createAdminClient();
  const { data: jobs, error } = await admin.from('notification_jobs')
    .select('id, user_id, related_id, template_key').eq('event_type', 'dunning_retry').eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(50);
  if (error) return NextResponse.json({ error: 'Não foi possível consultar as retentativas.' }, { status: 500 });

  let retried = 0;
  let recovered = 0;
  let canceled = 0;
  for (const job of jobs ?? []) {
    if (!job.related_id) continue;
    const { data: claimed } = await admin.from('notification_jobs').update({ status: 'processing' })
      .eq('id', job.id).eq('status', 'pending').select('id').maybeSingle();
    if (!claimed) continue;
    const { data: subscription } = await admin.from('subscriptions').select('id, status')
      .eq('provider_subscription_id', job.related_id).maybeSingle();
    if (!subscription || subscription.status === 'active' || subscription.status === 'canceled') {
      await admin.from('notification_jobs').update({ status: 'skipped' }).eq('id', job.id);
      continue;
    }

    const attempt = Number(job.template_key.split('_').at(-1)) || 1;
    try {
      await retryEfiSubscription(job.related_id);
      retried += 1;
      const provider = await getEfiSubscription(job.related_id);
      if (['active', 'confirmed', 'paid'].includes(statusFrom(provider))) {
        await admin.from('subscriptions').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', subscription.id);
        await admin.from('notification_jobs').update({ status: 'skipped' }).eq('related_id', job.related_id).eq('status', 'pending');
        recovered += 1;
      } else if (attempt >= 3) {
        await cancelEfiSubscription(job.related_id);
        await admin.from('subscriptions').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('id', subscription.id);
        const { data: authUser } = await admin.auth.admin.getUserById(job.user_id);
        if (authUser.user?.email) await sendDunningEmail(authUser.user.email, 'subscription_canceled');
        canceled += 1;
      } else {
        const { data: authUser } = await admin.auth.admin.getUserById(job.user_id);
        if (authUser.user?.email) await sendDunningEmail(authUser.user.email, 'payment_failed');
      }
      await admin.from('notification_jobs').update({ status: 'sent' }).eq('id', job.id);
    } catch {
      if (attempt >= 3) {
        try { await cancelEfiSubscription(job.related_id); } catch { /* O estado local é encerrado mesmo se o provedor estiver indisponível. */ }
        await admin.from('subscriptions').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('id', subscription.id);
        const { data: authUser } = await admin.auth.admin.getUserById(job.user_id);
        if (authUser.user?.email) await sendDunningEmail(authUser.user.email, 'subscription_canceled');
        canceled += 1;
      }
      await admin.from('notification_jobs').update({ status: attempt >= 3 ? 'sent' : 'failed' }).eq('id', job.id);
    }
  }
  return NextResponse.json({ processed: jobs?.length ?? 0, retried, recovered, canceled });
}

export const maxDuration = 60;
export { POST as GET };
