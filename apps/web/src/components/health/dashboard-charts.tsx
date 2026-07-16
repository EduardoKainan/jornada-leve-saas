'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type WeightPoint = { measured_at: string; weight_kg: string | number };
type MeasurementPoint = { measured_at: string; value_cm: string | number; measurement_type: string; custom_label: string | null };
const typeLabels: Record<string, string> = { cintura: 'Cintura', abdomen: 'Abdômen', quadril: 'Quadril', braco: 'Braço', coxa: 'Coxa' };
function shortDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(value)); }
function measurementKey(item: MeasurementPoint) { return item.measurement_type === 'personalizada' ? `custom:${item.custom_label ?? 'Personalizada'}` : item.measurement_type; }

export function DashboardCharts({ weights, measurements }: { weights: WeightPoint[]; measurements: MeasurementPoint[] }) {
  const [days, setDays] = useState(30);
  const measurementOptions = useMemo(() => Array.from(new Map(measurements.map((item) => [measurementKey(item), item.measurement_type === 'personalizada' ? item.custom_label ?? 'Personalizada' : typeLabels[item.measurement_type] ?? item.measurement_type])).entries()), [measurements]);
  const [selectedType, setSelectedType] = useState(() => measurementOptions[0]?.[0] ?? 'cintura');
  const cutoff = useMemo(() => { const value = new Date(); value.setDate(value.getDate() - days); return value; }, [days]);
  const weightData = weights.filter((item) => new Date(item.measured_at) >= cutoff).map((item) => ({ date: shortDate(item.measured_at), fullDate: item.measured_at, value: Number(item.weight_kg) }));
  const measurementData = measurements.filter((item) => measurementKey(item) === selectedType).map((item) => ({ date: shortDate(item.measured_at), fullDate: item.measured_at, value: Number(item.value_cm) }));

  return <div className="grid gap-4 lg:grid-cols-2">
    <Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Evolução do peso</CardTitle><CardDescription>Somente registros reais, sem preencher datas ausentes.</CardDescription></div><div className="flex gap-1">{[30, 90, 180].map((interval) => <Button key={interval} size="sm" variant="ghost" className={cn(days === interval && 'bg-primary/10 text-primary')} onClick={() => setDays(interval)}>{interval}d</Button>)}</div></div></CardHeader><CardContent>{weightData.length === 0 ? <EmptyChart text={`Nenhum peso nos últimos ${days} dias.`} /> : <div className="h-64 w-full" role="img" aria-label="Gráfico de evolução do peso"><ResponsiveContainer width="100%" height="100%"><LineChart data={weightData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} /><Tooltip labelFormatter={(_label, payload) => payload[0]?.payload?.fullDate ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(payload[0].payload.fullDate as string)) : ''} formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Peso']} /><Line type="linear" dataKey="value" connectNulls={false} stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>}</CardContent></Card>
    <Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Evolução das medidas</CardTitle><CardDescription>Compare uma medida por vez.</CardDescription></div>{measurementOptions.length > 0 && <select aria-label="Tipo de medida" className="h-9 rounded-xl border bg-background px-3 text-sm" value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>{measurementOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>}</div></CardHeader><CardContent>{measurementData.length === 0 ? <EmptyChart text="Registre uma medida para visualizar sua evolução." /> : <div className="h-64 w-full" role="img" aria-label="Gráfico de evolução das medidas"><ResponsiveContainer width="100%" height="100%"><LineChart data={measurementData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} /><Tooltip formatter={(value) => [`${Number(value).toFixed(1)} cm`, 'Medida']} /><Line type="linear" dataKey="value" connectNulls={false} stroke="var(--chart-2, var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>}</CardContent></Card>
  </div>;
}
function EmptyChart({ text }: { text: string }) { return <div className="grid h-64 place-items-center rounded-xl border border-dashed px-5 text-center text-sm text-muted-foreground">{text}</div>; }
