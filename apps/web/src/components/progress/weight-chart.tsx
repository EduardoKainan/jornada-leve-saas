'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Weight = { weight_kg: string | number; measured_at: string };

export function WeightProgressChart({ weights }: { weights: Weight[] }) {
  const [days, setDays] = useState(90);
  const data = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return weights.filter((item) => new Date(item.measured_at) >= cutoff).map((item) => ({
      value: Number(item.weight_kg),
      date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(item.measured_at)),
      fullDate: item.measured_at,
    }));
  }, [days, weights]);
  return <Card><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Evolução do peso</CardTitle><CardDescription>Visualize somente os dados que você registrou.</CardDescription></div><div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">{[30, 90, 180].map((interval) => <Button key={interval} size="sm" variant="ghost" className={cn('h-8', interval === days && 'bg-background text-primary shadow-sm')} onClick={() => setDays(interval)}>{interval}d</Button>)}</div></div></CardHeader><CardContent>{data.length === 0 ? <div className="grid h-72 place-items-center rounded-xl border border-dashed px-5 text-center text-sm text-muted-foreground">Nenhum peso nos últimos {days} dias.</div> : <div className="h-80 w-full" role="img" aria-label={`Gráfico de peso dos últimos ${days} dias`}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} /><Tooltip labelFormatter={(_label, payload) => payload[0]?.payload.fullDate ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(payload[0].payload.fullDate as string)) : ''} formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Peso']} /><Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>}</CardContent></Card>;
}