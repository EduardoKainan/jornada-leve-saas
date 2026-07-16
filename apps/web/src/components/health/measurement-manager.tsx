'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Ruler } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatMeasurement } from '@/lib/utils';

const standardTypes = [
  ['cintura', 'Cintura'], ['abdomen', 'Abdômen'], ['quadril', 'Quadril'], ['braco', 'Braço'], ['coxa', 'Coxa'],
] as const;
type StandardType = typeof standardTypes[number][0];
type Measurement = { id: string; measurement_type: string; value_cm: string | number; custom_label: string | null; measured_at: string };
type MeasurementPayload = { measurementType: StandardType | 'personalizada'; valueCm: number; measuredAt: string; customLabel?: string };
function localDateTime(date = new Date()) { const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function emptyValues(): Record<StandardType, string> { return { cintura: '', abdomen: '', quadril: '', braco: '', coxa: '' }; }
function labelFor(entry: Measurement) { return entry.measurement_type === 'personalizada' ? entry.custom_label ?? 'Personalizada' : standardTypes.find(([type]) => type === entry.measurement_type)?.[1] ?? entry.measurement_type; }

export function MeasurementManager() {
  const [values, setValues] = useState<Record<StandardType, string>>(emptyValues);
  const [customLabel, setCustomLabel] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [measuredAt, setMeasuredAt] = useState(localDateTime);
  const [entries, setEntries] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() { setLoading(true); try { const response = await fetch('/api/measurements?days=3650'); const body = await response.json() as { measurements?: Measurement[]; error?: string }; if (!response.ok) throw new Error(body.error); setEntries((body.measurements ?? []).reverse()); } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível carregar as medidas.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const records: MeasurementPayload[] = [];
    for (const [measurementType] of standardTypes) {
      if (values[measurementType]) records.push({ measurementType, valueCm: Number(values[measurementType]), measuredAt: new Date(measuredAt).toISOString() });
    }
    if (customValue) records.push({ measurementType: 'personalizada', valueCm: Number(customValue), measuredAt: new Date(measuredAt).toISOString(), customLabel });
    if (records.length === 0) return toast.error('Informe pelo menos uma medida.');
    if (customValue && !customLabel.trim()) return toast.error('Dê um nome à medida personalizada.');
    setSaving(true);
    try {
      for (const record of records) { const response = await fetch('/api/measurements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) }); const body = await response.json() as { error?: string }; if (!response.ok) throw new Error(body.error ?? 'Não foi possível salvar uma medida.'); }
      toast.success(records.length === 1 ? 'Medida registrada.' : `${records.length} medidas registradas.`); setValues(emptyValues()); setCustomLabel(''); setCustomValue(''); setMeasuredAt(localDateTime()); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6"><header><p className="text-sm text-muted-foreground">Mudanças além da balança</p><h1 className="text-2xl font-bold sm:text-3xl">Medidas</h1><p className="mt-2 text-sm text-muted-foreground">Preencha somente o que quiser acompanhar. Todos os valores são em centímetros.</p></header>
    <Card><CardHeader><CardTitle>Registrar medidas</CardTitle><CardDescription>Você pode registrar uma ou várias medidas na mesma data.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{standardTypes.map(([type, label]) => <div key={type} className="space-y-2"><Label htmlFor={type}>{label} (cm)</Label><Input id={type} type="number" min="1" max="500" step="0.1" inputMode="decimal" placeholder="Opcional" value={values[type]} onChange={(event) => setValues({ ...values, [type]: event.target.value })} /></div>)}</div><div className="grid gap-4 rounded-xl border border-dashed p-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="custom-label">Medida personalizada</Label><Input id="custom-label" maxLength={50} placeholder="Ex.: Panturrilha" value={customLabel} onChange={(event) => setCustomLabel(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="custom-value">Valor (cm)</Label><Input id="custom-value" type="number" min="1" max="500" step="0.1" inputMode="decimal" placeholder="Opcional" value={customValue} onChange={(event) => setCustomValue(event.target.value)} /></div></div><div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><div className="space-y-2"><Label htmlFor="measurement-date">Data e hora</Label><Input id="measurement-date" type="datetime-local" max={localDateTime()} value={measuredAt} onChange={(event) => setMeasuredAt(event.target.value)} required /></div><Button disabled={saving} type="submit">{saving ? 'Salvando…' : 'Registrar medidas'}</Button></div></form></CardContent></Card>
    <section><h2 className="mb-3 text-xl font-semibold">Histórico</h2>{loading ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Carregando medidas…</CardContent></Card> : entries.length === 0 ? <Card className="border-dashed"><CardContent className="grid justify-items-center py-10 text-center"><Ruler className="mb-3 size-8 text-primary" /><p className="font-medium">Nenhuma medida registrada</p><p className="mt-1 text-sm text-muted-foreground">Registre apenas as medidas que fizerem sentido para você.</p></CardContent></Card> : <div className="grid gap-3 sm:grid-cols-2">{entries.map((entry) => <Card key={entry.id}><CardContent className="py-4"><p className="text-sm text-muted-foreground">{labelFor(entry)}</p><p className="text-lg font-semibold">{formatMeasurement(Number(entry.value_cm))}</p><p className="text-xs text-muted-foreground">{formatDate(entry.measured_at)}</p></CardContent></Card>)}</div>}</section>
  </div>;
}
