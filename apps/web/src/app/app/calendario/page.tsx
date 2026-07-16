import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildCalendarDays } from '@/lib/sprint3';
import { createClient } from '@/lib/supabase/server';
import { cn, formatWeight } from '@/lib/utils';

const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function validMonth(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split('-').map(Number);
  return year && month && month >= 1 && month <= 12 ? { year, month: month - 1 } : null;
}

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function weightDateKey(value: string, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ mes?: string; dia?: string }> }) {
  const params = await searchParams;
  const today = new Date();
  const requested = validMonth(params.mes) ?? { year: today.getFullYear(), month: today.getMonth() };
  const firstDay = `${monthParam(requested.year, requested.month)}-01`;
  const lastDate = new Date(requested.year, requested.month + 1, 0);
  const lastDay = `${monthParam(requested.year, requested.month)}-${String(lastDate.getDate()).padStart(2, '0')}`;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: checkins, error: checkinError }, { data: weights, error: weightError }] = await Promise.all([
    supabase.from('profiles').select('timezone').eq('id', user!.id).single(),
    supabase.from('daily_checkins').select('checkin_date').eq('user_id', user!.id).gte('checkin_date', firstDay).lte('checkin_date', lastDay),
    supabase.from('weight_entries').select('weight_kg, measured_at').eq('user_id', user!.id).gte('measured_at', `${firstDay}T00:00:00-03:00`).lte('measured_at', `${lastDay}T23:59:59-03:00`).order('measured_at'),
  ]);
  const timezone = profile?.timezone ?? 'America/Sao_Paulo';
  const checkinDates = new Set((checkins ?? []).map((item) => item.checkin_date));
  const weightsByDate = new Map<string, number>();
  for (const weight of weights ?? []) weightsByDate.set(weightDateKey(weight.measured_at, timezone), Number(weight.weight_kg));
  const days = buildCalendarDays(requested.year, requested.month, checkinDates, weightsByDate, today);
  const selected = params.dia ? days.find((day) => day.dateKey === params.dia && day.isCurrentMonth && !day.isFuture) : undefined;
  const previous = new Date(requested.year, requested.month - 1, 1);
  const next = new Date(requested.year, requested.month + 1, 1);
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(requested.year, requested.month, 1));
  const hasRecords = checkinDates.size > 0 || weightsByDate.size > 0;
  const hasError = Boolean(checkinError || weightError);

  return <div className="mx-auto max-w-3xl space-y-5">
    <header><p className="text-sm text-muted-foreground">Seu histórico dia a dia</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Calendário</h1></header>
    <Card>
      <CardHeader className="p-4 sm:p-6"><div className="flex items-center justify-between"><Link aria-label="Mês anterior" href={`/app/calendario?mes=${monthParam(previous.getFullYear(), previous.getMonth())}`} className="grid size-11 place-items-center rounded-xl hover:bg-accent"><ChevronLeft className="size-5" /></Link><CardTitle className="text-center capitalize">{monthLabel}</CardTitle><Link aria-label="Próximo mês" href={`/app/calendario?mes=${monthParam(next.getFullYear(), next.getMonth())}`} className="grid size-11 place-items-center rounded-xl hover:bg-accent"><ChevronRight className="size-5" /></Link></div></CardHeader>
      <CardContent className="px-2 pb-4 sm:px-6 sm:pb-6">
        <div className="grid grid-cols-7">{weekdays.map((weekday) => <div key={weekday} className="pb-2 text-center text-[11px] font-medium text-muted-foreground sm:text-xs">{weekday}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">{days.map((day) => {
          const recorded = day.hasCheckin || day.weightKg !== null;
          const content = <><span>{day.dayNumber}</span>{recorded && <span className="absolute bottom-1.5 size-1.5 rounded-full bg-emerald-500" />}</>;
          return day.isCurrentMonth && !day.isFuture
            ? <Link aria-label={`${day.dayNumber} de ${monthLabel}${recorded ? ', com registro' : ''}`} key={day.dateKey} href={`/app/calendario?mes=${monthParam(requested.year, requested.month)}&dia=${day.dateKey}`} className={cn('relative flex aspect-square min-h-10 items-center justify-center rounded-xl text-sm hover:bg-accent', params.dia === day.dateKey && 'bg-primary text-primary-foreground hover:bg-primary/90', params.dia === day.dateKey && recorded && '[&>span:last-child]:bg-primary-foreground')}>{content}</Link>
            : <div key={day.dateKey} aria-disabled={day.isFuture} className={cn('relative flex aspect-square min-h-10 items-center justify-center rounded-xl text-sm', !day.isCurrentMonth && 'text-muted-foreground/40', day.isFuture && day.isCurrentMonth && 'cursor-not-allowed text-muted-foreground/50')}>{content}</div>;
        })}</div>
      </CardContent>
    </Card>
    {hasError ? <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar todos os registros deste mês. Tente novamente.</div>
      : selected ? <Card><CardHeader><CardTitle className="text-lg">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${selected.dateKey}T12:00:00`))}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><div className="flex items-center gap-3 rounded-xl bg-muted p-4"><ClipboardCheck className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">Check-in</p><p className="font-medium">{selected.hasCheckin ? 'Realizado' : 'Não realizado'}</p></div></div><div className="flex items-center gap-3 rounded-xl bg-muted p-4"><Scale className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">Peso</p><p className="font-medium">{selected.weightKg === null ? 'Sem registro' : formatWeight(selected.weightKg)}</p></div></div></CardContent></Card>
      : !hasRecords && <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed px-6 text-center"><div><CalendarDays className="mx-auto mb-3 size-8 text-primary" /><h2 className="font-semibold">Nenhum registro neste mês</h2><p className="mt-1 text-sm text-muted-foreground">Seus check-ins e pesos aparecerão aqui.</p></div></div>}
  </div>;
}