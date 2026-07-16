'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, formatDate } from '@/lib/utils';

type Symptom = { id: string; code: string; label_pt: string };
type Checkin = {
  id: string;
  checkin_date: string;
  hunger_level: number | null;
  energy_level: number | null;
  sleep_quality: number | null;
  activity_level: string | null;
  water_ml: number | null;
  note: string | null;
  checkin_symptoms?: Array<{ symptom_id: string; symptom_catalog: { id: string; label_pt: string } | null }>;
};
type FormState = { checkinDate: string; hungerLevel: number; energyLevel: number; sleepQuality: number; activityLevel: string; waterMl: string; symptomIds: string[]; note: string };

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
function initialForm(): FormState { return { checkinDate: localDate(), hungerLevel: 3, energyLevel: 3, sleepQuality: 3, activityLevel: 'nenhuma', waterMl: '', symptomIds: [], note: '' }; }

function ScaleField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <fieldset><legend className="mb-2 text-sm font-medium">{label}</legend><div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((number) => <button type="button" key={number} onClick={() => onChange(number)} aria-pressed={value === number} className={cn('h-10 rounded-xl border text-sm font-semibold transition-colors', value === number ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent')}>{number}</button>)}</div><div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>Baixo</span><span>Alto</span></div></fieldset>;
}

export function CheckinManager() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const earliest = useMemo(() => { const date = new Date(); date.setDate(date.getDate() - 30); return localDate(date); }, []);

  async function load() {
    setLoading(true);
    try {
      const [checkinResponse, symptomResponse] = await Promise.all([fetch('/api/checkins'), fetch('/api/symptoms')]);
      const checkinBody = await checkinResponse.json() as { checkins?: Checkin[]; error?: string };
      const symptomBody = await symptomResponse.json() as { symptoms?: Symptom[]; error?: string };
      if (!checkinResponse.ok) throw new Error(checkinBody.error);
      if (!symptomResponse.ok) throw new Error(symptomBody.error);
      setCheckins(checkinBody.checkins ?? []);
      setSymptoms(symptomBody.symptoms ?? []);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os dados.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    const payload = { ...form, waterMl: form.waterMl ? Number(form.waterMl) : undefined };
    if (editingId) delete (payload as Partial<typeof payload>).checkinDate;
    try {
      const response = await fetch(editingId ? `/api/checkins/${editingId}` : '/api/checkins', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Não foi possível salvar.');
      toast.success(editingId ? 'Check-in atualizado.' : 'Check-in registrado.');
      setEditingId(null); setForm(initialForm()); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }

  function edit(checkin: Checkin) {
    setEditingId(checkin.id);
    setForm({ checkinDate: checkin.checkin_date, hungerLevel: checkin.hunger_level ?? 3, energyLevel: checkin.energy_level ?? 3, sleepQuality: checkin.sleep_quality ?? 3, activityLevel: checkin.activity_level ?? 'nenhuma', waterMl: checkin.water_ml?.toString() ?? '', symptomIds: checkin.checkin_symptoms?.map((item) => item.symptom_id) ?? [], note: checkin.note ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function remove(id: string) {
    if (!window.confirm('Excluir este check-in?')) return;
    const response = await fetch(`/api/checkins/${id}`, { method: 'DELETE' });
    const body = await response.json() as { error?: string };
    if (!response.ok) return toast.error(body.error ?? 'Não foi possível excluir.');
    toast.success('Check-in excluído.'); await load();
  }

  return <div className="space-y-6">
    <header><p className="text-sm text-muted-foreground">Leva menos de um minuto</p><h1 className="text-2xl font-bold sm:text-3xl">Check-in diário</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Observe como você está hoje. Não há resposta certa ou errada.</p></header>
    <Card><CardHeader><CardTitle>{editingId ? 'Editar check-in' : 'Como você está?'}</CardTitle><CardDescription>Os campos ajudam você a perceber padrões ao longo do tempo.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-6">
      <div className="space-y-2"><Label htmlFor="checkin-date">Data</Label><Input id="checkin-date" type="date" min={earliest} max={localDate()} disabled={Boolean(editingId)} value={form.checkinDate} onChange={(event) => setForm({ ...form, checkinDate: event.target.value })} required /></div>
      <div className="grid gap-6 sm:grid-cols-3"><ScaleField label="Fome" value={form.hungerLevel} onChange={(value) => setForm({ ...form, hungerLevel: value })} /><ScaleField label="Energia" value={form.energyLevel} onChange={(value) => setForm({ ...form, energyLevel: value })} /><ScaleField label="Qualidade do sono" value={form.sleepQuality} onChange={(value) => setForm({ ...form, sleepQuality: value })} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="activity">Atividade</Label><select id="activity" value={form.activityLevel} onChange={(event) => setForm({ ...form, activityLevel: event.target.value })} className="h-11 w-full rounded-xl border bg-background px-3 text-sm"><option value="nenhuma">Nenhuma</option><option value="leve">Leve</option><option value="moderada">Moderada</option><option value="intensa">Intensa</option></select></div><div className="space-y-2"><Label htmlFor="water">Hidratação (ml)</Label><Input id="water" type="number" min="0" max="15000" step="100" inputMode="numeric" placeholder="Ex.: 1800" value={form.waterMl} onChange={(event) => setForm({ ...form, waterMl: event.target.value })} /></div></div>
      <fieldset><legend className="mb-2 text-sm font-medium">Sintomas (opcional)</legend><div className="flex flex-wrap gap-2">{symptoms.map((symptom) => { const selected = form.symptomIds.includes(symptom.id); return <button key={symptom.id} type="button" aria-pressed={selected} onClick={() => setForm({ ...form, symptomIds: selected ? form.symptomIds.filter((id) => id !== symptom.id) : [...form.symptomIds, symptom.id] })} className={cn('rounded-full border px-3 py-2 text-sm', selected ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-accent')}>{symptom.label_pt}</button>; })}</div></fieldset>
      <div className="space-y-2"><div className="flex justify-between"><Label htmlFor="note">Observação (opcional)</Label><span className="text-xs text-muted-foreground">{form.note.length}/500</span></div><textarea id="note" maxLength={500} rows={3} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Algo que você queira lembrar?" className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm" /><p className="text-xs text-muted-foreground">Sua observação é criptografada antes de ser armazenada.</p></div>
      <div className="flex gap-3"><Button disabled={saving} type="submit">{saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Concluir check-in'}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(initialForm()); }}>Cancelar</Button>}</div>
    </form></CardContent></Card>
    <section><h2 className="mb-3 text-xl font-semibold">Histórico</h2>{loading ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Carregando check-ins…</CardContent></Card> : checkins.length === 0 ? <Card className="border-dashed"><CardContent className="py-10 text-center text-sm text-muted-foreground">Seu primeiro check-in aparecerá aqui.</CardContent></Card> : <div className="space-y-3">{checkins.map((checkin) => <Card key={checkin.id}><CardContent className="flex items-start justify-between gap-3 py-4"><div><p className="font-medium">{formatDate(`${checkin.checkin_date}T12:00:00`)}</p><p className="mt-1 text-sm text-muted-foreground">Fome {checkin.hunger_level ?? '—'} · Energia {checkin.energy_level ?? '—'} · Sono {checkin.sleep_quality ?? '—'} · {checkin.water_ml ? `${checkin.water_ml} ml` : 'hidratação não informada'}</p>{checkin.note && <p className="mt-2 text-sm">{checkin.note}</p>}</div><div className="flex shrink-0"><Button aria-label="Editar" variant="ghost" size="icon" onClick={() => edit(checkin)}><Pencil className="size-4" /></Button><Button aria-label="Excluir" variant="ghost" size="icon" onClick={() => void remove(checkin.id)}><Trash2 className="size-4 text-destructive" /></Button></div></CardContent></Card>)}</div>}</section>
  </div>;
}
