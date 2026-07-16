'use client';

import { CalendarRange, FileText, LoaderCircle } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Preset = '7d' | '30d' | '90d' | 'custom';
const periods: { value: Preset; label: string }[] = [{ value: '7d', label: 'Últimos 7 dias' }, { value: '30d', label: 'Últimos 30 dias' }, { value: '90d', label: 'Últimos 90 dias' }, { value: 'custom', label: 'Personalizado' }];
const sectionOptions = [{ value: 'weight', label: 'Peso' }, { value: 'measurements', label: 'Medidas' }, { value: 'checkins', label: 'Check-ins' }, { value: 'routines', label: 'Rotinas' }, { value: 'appointments', label: 'Consultas' }] as const;

export function ReportConfig({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [preset, setPreset] = useState<Preset>('30d');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [sections, setSections] = useState<string[]>(sectionOptions.map((item) => item.value));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const preview = useMemo(() => {
    const period = periods.find((item) => item.value === preset)?.label.toLowerCase();
    const selected = sectionOptions.filter((item) => sections.includes(item.value)).map((item) => item.label.toLowerCase());
    return `O PDF reunirá ${selected.length ? selected.join(', ') : 'nenhuma seção'} no período ${period}${preset === 'custom' && start && end ? ` (${start.split('-').reverse().join('/')} a ${end.split('-').reverse().join('/')})` : ''}.`;
  }, [end, preset, sections, start]);
  function toggle(section: string) { setSections((current) => current.includes(section) ? current.filter((item) => item !== section) : [...current, section]); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!sections.length) { setError('Selecione pelo menos uma seção.'); return; }
    if (preset === 'custom' && (!start || !end)) { setError('Informe a data inicial e a data final.'); return; }
    setSubmitting(true);
    const period = preset === 'custom' ? { preset, start, end } : { preset };
    const response = await fetch('/api/reports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ period, sections }) });
    const body = await response.json().catch(() => ({})) as { error?: string };
    setSubmitting(false);
    if (!response.ok) { setError(body.error ?? 'Não foi possível gerar o relatório.'); return; }
    onCreated();
  }
  return <form onSubmit={submit} className="space-y-6">
    <fieldset className="space-y-3"><legend className="font-semibold">1. Escolha o período</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{periods.map((item) => <button type="button" key={item.value} onClick={() => setPreset(item.value)} className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium ${preset === item.value ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-accent'}`}>{item.label}</button>)}</div></fieldset>
    {preset === 'custom' && <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="report-start">Data inicial</Label><Input id="report-start" type="date" required value={start} onChange={(event) => setStart(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="report-end">Data final</Label><Input id="report-end" type="date" required value={end} onChange={(event) => setEnd(event.target.value)} /></div></div>}
    <fieldset className="space-y-3"><legend className="font-semibold">2. Selecione as seções</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{sectionOptions.map((item) => { const checked = sections.includes(item.value); return <label key={item.value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 ${checked ? 'border-primary bg-primary/5' : ''}`}><input type="checkbox" className="size-4 accent-primary" checked={checked} onChange={() => toggle(item.value)} /><span className="text-sm font-medium">{item.label}</span></label>; })}</div></fieldset>
    <div className="rounded-2xl bg-muted p-4"><div className="mb-2 flex items-center gap-2 font-medium"><FileText className="size-4 text-primary" /> Preview do relatório</div><p className="text-sm text-muted-foreground">{preview}</p><p className="mt-2 text-xs text-amber-700">Inclui o disclaimer médico obrigatório e dados informados por você.</p></div>
    {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Voltar</Button><Button type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="size-4 animate-spin" /> : <CalendarRange className="size-4" />} {submitting ? 'Iniciando…' : 'Gerar relatório'}</Button></div>
  </form>;
}
