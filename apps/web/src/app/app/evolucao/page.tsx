import Link from 'next/link';
import { Flame, Scale, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { WeightProgressChart } from '@/components/progress/weight-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateCheckinStreak } from '@/lib/sprint3';
import { createClient } from '@/lib/supabase/server';
import { formatWeight } from '@/lib/utils';

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: weights, error: weightError }, { data: checkins, error: checkinError }, { data: goal }] = await Promise.all([
    supabase.from('weight_entries').select('weight_kg, measured_at').eq('user_id', user!.id).order('measured_at', { ascending: true }).limit(1000),
    supabase.from('daily_checkins').select('checkin_date').eq('user_id', user!.id).order('checkin_date', { ascending: false }).limit(1000),
    supabase.from('user_goals').select('target_weight_kg').eq('user_id', user!.id).is('archived_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const first = weights?.[0];
  const current = weights?.at(-1);
  const variation = first && current ? Number(current.weight_kg) - Number(first.weight_kg) : null;
  const streak = calculateCheckinStreak((checkins ?? []).map((item) => item.checkin_date));
  const hasError = Boolean(weightError || checkinError);
  return <div className="space-y-6">
    <header><p className="text-sm text-muted-foreground">Celebre cada passo</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sua evolução</h1></header>
    {hasError && <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar todos os dados de evolução.</div>}
    {!weights?.length ? <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><Scale className="mb-4 size-10 text-primary" /><h2 className="text-lg font-semibold">Sua evolução começa no primeiro registro</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Registre seu peso para acompanhar a mudança ao longo do tempo, sem julgamentos.</p><Link href="/app/peso" className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 font-medium text-primary-foreground">Registrar peso</Link></CardContent></Card> : <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
        { label: 'Peso inicial', value: first ? formatWeight(Number(first.weight_kg)) : '—', icon: Scale },
        { label: 'Peso atual', value: current ? formatWeight(Number(current.weight_kg)) : '—', icon: Scale },
        { label: 'Variação', value: variation === null ? '—' : `${variation > 0 ? '+' : ''}${variation.toFixed(1)} kg`, icon: variation !== null && variation <= 0 ? TrendingDown : TrendingUp },
        { label: 'Meta', value: goal?.target_weight_kg ? formatWeight(Number(goal.target_weight_kg)) : 'Não definida', icon: Target },
      ].map(({ label, value, icon: Icon }) => <Card key={label}><CardHeader className="p-4 sm:p-6"><CardDescription>{label}</CardDescription><CardTitle className="mt-1 flex items-center gap-2 text-lg sm:text-xl"><Icon className="size-5 shrink-0 text-primary" /><span className="truncate">{value}</span></CardTitle></CardHeader></Card>)}</section>
      <Card className="border-primary/20 bg-primary/5"><CardContent className="flex items-center gap-4 p-5"><div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10"><Flame className="size-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Sequência de check-ins</p><p className="text-xl font-bold">{streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}</p></div></CardContent></Card>
      <WeightProgressChart weights={weights} />
    </>}
  </div>;
}