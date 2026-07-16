import { NextResponse, type NextRequest } from 'next/server';
import { decryptNote, encryptNote } from '@/lib/health';
import {
  applicationSchema,
  decodeApplicationDetails,
  encodeApplicationDetails,
  MOUNJARO_PLAN_NAME,
} from '@/lib/mounjaro';
import { createClient } from '@/lib/supabase/server';

const eventSelect = 'id, plan_id, scheduled_at, status, completed_at, encrypted_note, created_at';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });

  const { data: plans, error: planError } = await supabase
    .from('routine_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('user_entered_name', MOUNJARO_PLAN_NAME);
  if (planError)
    return NextResponse.json(
      { error: 'Não foi possível carregar seu plano de aplicação.' },
      { status: 500 },
    );
  const planIds = (plans ?? []).map((plan) => plan.id);
  if (planIds.length === 0) return NextResponse.json({ applications: [] });

  const { data: events, error } = await supabase
    .from('routine_events')
    .select(eventSelect)
    .eq('user_id', user.id)
    .in('plan_id', planIds)
    .order('scheduled_at', { ascending: false })
    .limit(200);
  if (error)
    return NextResponse.json(
      { error: 'Não foi possível carregar as aplicações.' },
      { status: 500 },
    );

  const applications = (events ?? []).flatMap((event) => {
    const details = decodeApplicationDetails(decryptNote(event.encrypted_note));
    if (!details) return [];
    return [
      {
        id: event.id,
        applicationDate: event.scheduled_at,
        status: event.status,
        completedAt: event.completed_at,
        ...details,
      },
    ];
  });
  return NextResponse.json({ applications });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });

  const parsed = applicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    );
  if (parsed.data.applicationDate > new Date().toISOString().slice(0, 10)) {
    return NextResponse.json(
      { error: 'A data da aplicação não pode estar no futuro.' },
      { status: 400 },
    );
  }

  const scheduledAt = `${parsed.data.applicationDate}T12:00:00.000Z`;
  let encryptedDetails: string | null;
  try {
    encryptedDetails = encryptNote(
      encodeApplicationDetails({
        dose: parsed.data.dose,
        location: parsed.data.location,
        symptoms: parsed.data.symptoms,
        notes: parsed.data.notes,
      }),
    );
  } catch {
    return NextResponse.json(
      { error: 'A criptografia das observações não está configurada.' },
      { status: 500 },
    );
  }

  const { data: existingPlan, error: findPlanError } = await supabase
    .from('routine_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('user_entered_name', MOUNJARO_PLAN_NAME)
    .eq('active', true)
    .limit(1)
    .maybeSingle();
  if (findPlanError)
    return NextResponse.json(
      { error: 'Não foi possível localizar seu plano de aplicação.' },
      { status: 500 },
    );

  let planId = existingPlan?.id;
  if (!planId) {
    const { data: createdPlan, error: createPlanError } = await supabase
      .from('routine_plans')
      .insert({
        user_id: user.id,
        user_entered_name: MOUNJARO_PLAN_NAME,
        dose_value: Number(parsed.data.dose),
        dose_unit: 'mg',
        recurrence_rule: 'FREQ=WEEKLY;INTERVAL=1',
        start_at: scheduledAt,
        active: true,
      })
      .select('id')
      .single();
    if (createPlanError || !createdPlan)
      return NextResponse.json(
        { error: 'Não foi possível criar seu plano de aplicação.' },
        { status: 500 },
      );
    planId = createdPlan.id;
  }

  const { data: event, error } = await supabase
    .from('routine_events')
    .insert({
      plan_id: planId,
      user_id: user.id,
      scheduled_at: scheduledAt,
      status: 'completed',
      completed_at: scheduledAt,
      encrypted_note: encryptedDetails,
    })
    .select(eventSelect)
    .single();
  if (error || !event)
    return NextResponse.json({ error: 'Não foi possível registrar a aplicação.' }, { status: 500 });

  return NextResponse.json(
    {
      application: {
        id: event.id,
        applicationDate: event.scheduled_at,
        status: event.status,
        completedAt: event.completed_at,
        dose: parsed.data.dose,
        location: parsed.data.location,
        symptoms: parsed.data.symptoms,
        notes: parsed.data.notes,
      },
    },
    { status: 201 },
  );
}
