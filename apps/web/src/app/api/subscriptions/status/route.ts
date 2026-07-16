import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function safeOutcome(value: string | null) {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed !== null && typeof parsed === 'object' ? parsed : { status: value };
  } catch {
    return { status: value };
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  const admin = createAdminClient();
  const { data: subscription, error } = await admin.from('subscriptions')
    .select('id, provider_subscription_id, plan_code, status, trial_ends_at, current_period_end, cancel_at_period_end, created_at, updated_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível consultar sua assinatura.' }, { status: 500 });

  let events: Array<Record<string, unknown>> = [];
  if (subscription?.provider_subscription_id) {
    const { data } = await admin.from('payment_events')
      .select('id, event_type, outcome, processed_at, created_at')
      .like('provider_event_id', `${subscription.provider_subscription_id}:%`)
      .eq('signature_valid', true).order('created_at', { ascending: false }).limit(50);
    events = (data ?? []).map((event) => ({ ...event, details: safeOutcome(event.outcome), outcome: undefined }));
  }
  return NextResponse.json({ subscription, events });
}
