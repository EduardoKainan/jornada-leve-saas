import Link from 'next/link';
import { CalendarClock, ChevronRight, ClipboardCheck, ClipboardPlus, Ruler, Scale, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { ShareEvolutionActions } from '@/components/share/share-evolution-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCharts } from '@/components/health/dashboard-charts';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatWeight } from '@/lib/utils';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ 'boas-vindas'?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const [{ data: profile }, { data: weights }, { data: measurements }, { data: checkins }, { data: routine }, { data: appointment }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user!.id).single(),
    supabase.from('weight_entries').select('weight_kg, measured_at').eq('user_id', user!.id).order('measured_at', { ascending: true }).limit(500),
    supabase.from('measurement_entries').select('measurement_type, value_cm, custom_label, measured_at').eq('user_id', user!.id).order('measured_at', { ascending: true }).limit(1000),
    supabase.from('daily_checkins').select('checkin_date, hunger_level, energy_level, sleep_quality, activity_level').eq('user_id', user!.id).order('checkin_date', { ascending: false }).limit(1),
    supabase.from('routine_events').select('scheduled_at').eq('user_id', user!.id).eq('status', 'pending').gte('scheduled_at', now).order('scheduled_at').limit(1),
    supabase.from('appointments').select('starts_at').eq('user_id', user!.id).gte('starts_at', now).order('starts_at').limit(1),
  ]);
  const params = await searchParams;
  const firstWeight = weights?.[0];
  const latestWeight = weights?.at(-1);
  const variation = firstWeight && latestWeight ? Number(latestWeight.weight_kg) - Number(firstWeight.weight_kg) : null;
  const latestCheckin = checkins?.[0];
  const eventDates = [routine?.[0]?.scheduled_at, appointment?.[0]?.starts_at].filter((value): value is string => Boolean(value));
  const nextEvent = eventDates.sort()[0];
  const firstName = profile?.display_name.split(' ')[0] ?? 'você';

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-muted-foreground">Seu espaço de acompanhamento</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Olá, {firstName}!</h1></div><div className="flex flex-col gap-2 sm:flex-row"><ShareEvolutionActions compact /><Link href="/app/registrar" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90"><ClipboardPlus className="size-5" /> Registrar agora</Link></div></header>
    {params['boas-vindas'] === '1' && <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4"><Sparkles className="mt-0.5 size-5 shrink-0 text-primary" /><div><strong>Seu espaço está pronto!</strong><p className="mt-1 text-sm text-muted-foreground">Comece com um registro e acompanhe cada pequena conquista.</p></div></div>}
    <section><h2 className="mb-3 text-lg font-semibold">Resumo do dia</h2><div className="grid gap-4 sm:grid-cols-3">
      <Card><CardHeader className="pb-3"><CardDescription>Último check-in</CardDescription><CardTitle className="flex items-center gap-2 text-lg"><ClipboardCheck className="size-5 text-primary" />{latestCheckin ? formatDate(`${latestCheckin.checkin_date}T12:00:00`) : 'Ainda não feito'}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{latestCheckin ? `Fome ${latestCheckin.hunger_level ?? '—'} · Energia ${latestCheckin.energy_level ?? '—'} · Sono ${latestCheckin.sleep_quality ?? '—'}` : 'Conte como você está em menos de um minuto.'}</p><Link href="/app/check-in" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">{latestCheckin ? 'Ver histórico' : 'Fazer check-in'} <ChevronRight className="size-4" /></Link></CardContent></Card>
      <Card><CardHeader className="pb-3"><CardDescription>Último peso</CardDescription><CardTitle className="flex items-center gap-2 text-lg"><Scale className="size-5 text-primary" />{latestWeight ? formatWeight(Number(latestWeight.weight_kg)) : 'Nenhum registro'}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{latestWeight ? formatDate(latestWeight.measured_at) : 'Registre quando se sentir confortável.'}</p><Link href="/app/peso" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">Registrar peso <ChevronRight className="size-4" /></Link></CardContent></Card>
      <Card><CardHeader className="pb-3"><CardDescription>Próximo evento</CardDescription><CardTitle className="flex items-center gap-2 text-lg"><CalendarClock className="size-5 text-primary" />{nextEvent ? formatDate(nextEvent) : 'Agenda livre'}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{nextEvent ? 'Seu próximo compromisso já está organizado.' : 'Você ainda não tem eventos agendados.'}</p></CardContent></Card>
    </div></section>
    <section className="grid gap-4 sm:grid-cols-3"><Card><CardHeader><CardDescription>Peso inicial</CardDescription><CardTitle>{firstWeight ? formatWeight(Number(firstWeight.weight_kg)) : '—'}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>Peso atual</CardDescription><CardTitle>{latestWeight ? formatWeight(Number(latestWeight.weight_kg)) : '—'}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>Variação total</CardDescription><CardTitle className="flex items-center gap-2">{variation === null ? '—' : <>{variation <= 0 ? <TrendingDown className="size-5 text-primary" /> : <TrendingUp className="size-5 text-amber-600" />}{variation > 0 ? '+' : ''}{variation.toFixed(1)} kg</>}</CardTitle></CardHeader></Card></section>
    <DashboardCharts weights={weights ?? []} measurements={measurements ?? []} />
    {(!weights?.length || !measurements?.length) && <Card className="border-dashed"><CardContent className="flex flex-col items-center px-5 py-8 text-center"><Ruler className="mb-3 size-7 text-primary" /><h2 className="font-semibold">Construa sua visão completa</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Peso e medidas aparecem em módulos independentes. Registre apenas o que fizer sentido para você.</p><Link href="/app/medidas" className="mt-4 text-sm font-medium text-primary">Registrar medidas</Link></CardContent></Card>}
  </div>;
}
