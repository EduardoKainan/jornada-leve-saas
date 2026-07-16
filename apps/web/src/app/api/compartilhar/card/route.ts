import { ImageResponse } from '@vercel/og';
import { createElement } from 'react';
import { NextResponse } from 'next/server';
import { buildShareCardStats, formatWeightChange, type WeightRecord } from '@/lib/share-card';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CARD_SIZE = 1080;

const box = (style: React.CSSProperties, ...children: React.ReactNode[]) => createElement('div', { style }, ...children);

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  }

  const [firstResult, latestResult, checkinsResult, reportsResult] = await Promise.all([
    supabase.from('weight_entries').select('weight_kg, measured_at').eq('user_id', user.id).order('measured_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('weight_entries').select('weight_kg, measured_at').eq('user_id', user.id).order('measured_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('daily_checkins').select('checkin_date', { count: 'exact' }).eq('user_id', user.id).order('checkin_date', { ascending: false }).limit(1000),
    supabase.from('report_jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'ready'),
  ]);

  if (firstResult.error || latestResult.error || checkinsResult.error || reportsResult.error) {
    return NextResponse.json({ error: 'Não foi possível gerar seu card de evolução.' }, { status: 500 });
  }

  const stats = buildShareCardStats({
    firstWeight: firstResult.data as WeightRecord | null,
    latestWeight: latestResult.data as WeightRecord | null,
    checkinDates: (checkinsResult.data ?? []).map((item) => item.checkin_date),
    totalCheckins: checkinsResult.count ?? 0,
    totalReports: reportsResult.count ?? 0,
  });

  const metric = formatWeightChange(stats.weightChangeKg);
  const periodLabel = stats.trackingDays === 1 ? 'em 1 dia de acompanhamento' : stats.trackingDays > 1 ? `em ${stats.trackingDays} dias de acompanhamento` : 'comece registrando seu peso';

  return new ImageResponse(
    box(
      { background: 'linear-gradient(135deg, #063d32, #0a6b55)', width: '100%', height: '100%', padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'sans-serif' },
      box(
        { display: 'flex', alignItems: 'center', gap: 14 },
        box({ width: 54, height: 54, background: '#10b981', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }, '🌿'),
        box({ color: '#ffffff', fontSize: 34, fontWeight: 800 }, 'Jornada Leve'),
      ),
      box(
        { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
        box({ fontSize: 120, lineHeight: 1, fontWeight: 900, letterSpacing: -5, color: '#10b981' }, metric),
        box({ marginTop: 20, fontSize: 36, color: '#a7f3d0' }, periodLabel),
      ),
      box(
        { display: 'flex', justifyContent: 'space-around', width: '100%' },
        ...[
          [stats.streak, stats.streak === 1 ? 'dia consecutivo' : 'dias consecutivos'],
          [stats.totalCheckins, stats.totalCheckins === 1 ? 'check-in' : 'check-ins'],
          [stats.totalReports, stats.totalReports === 1 ? 'relatório' : 'relatórios'],
        ].map(([value, label]) => box(
          { width: '30%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
          box({ fontSize: 58, fontWeight: 800, color: '#ffffff' }, String(value)),
          box({ marginTop: 8, fontSize: 24, color: '#a7f3d0' }, String(label)),
        )),
      ),
      box({ display: 'flex', justifyContent: 'center', textAlign: 'center', fontSize: 20, color: '#6ee7b7' }, 'Acompanhamento não substitui orientação médica.'),
    ),
    {
      width: CARD_SIZE,
      height: CARD_SIZE,
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    },
  );
}
