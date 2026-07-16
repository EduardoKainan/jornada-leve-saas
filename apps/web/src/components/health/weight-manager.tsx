'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Scale, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatWeight } from '@/lib/utils';

type WeightEntry = { id: string; weight_kg: string | number; measured_at: string; source: string };
function localDateTime(date = new Date()) { const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }

export function WeightManager() {
  const [weightKg, setWeightKg] = useState('');
  const [measuredAt, setMeasuredAt] = useState(localDateTime);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { const response = await fetch('/api/weights?days=3650'); const body = await response.json() as { weights?: WeightEntry[]; error?: string }; if (!response.ok) throw new Error(body.error); setEntries((body.weights ?? []).reverse()); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os pesos.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/weights/${editingId}` : '/api/weights', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weightKg: Number(weightKg), measuredAt: new Date(measuredAt).toISOString() }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Não foi possível salvar.');
      toast.success(editingId ? 'Peso atualizado.' : 'Peso registrado.'); setWeightKg(''); setMeasuredAt(localDateTime()); setEditingId(null); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }
  function edit(entry: WeightEntry) { setEditingId(entry.id); setWeightKg(Number(entry.weight_kg).toFixed(1)); setMeasuredAt(localDateTime(new Date(entry.measured_at))); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function remove(id: string) { if (!window.confirm('Excluir este registro de peso?')) return; const response = await fetch(`/api/weights/${id}`, { method: 'DELETE' }); const body = await response.json() as { error?: string }; if (!response.ok) return toast.error(body.error ?? 'Não foi possível excluir.'); toast.success('Registro excluído.'); await load(); }

  return <div className="space-y-6"><header><p className="text-sm text-muted-foreground">Acompanhe no seu ritmo</p><h1 className="text-2xl font-bold sm:text-3xl">Peso</h1><p className="mt-2 text-sm text-muted-foreground">Oscilações são normais. Observe tendências, não um número isolado.</p></header>
    <Card><CardHeader><CardTitle>{editingId ? 'Editar registro' : 'Registrar peso'}</CardTitle><CardDescription>Informe o peso em quilogramas, com uma casa decimal.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><div className="space-y-2"><Label htmlFor="weight">Peso (kg)</Label><Input id="weight" type="number" min="30" max="350" step="0.1" inputMode="decimal" placeholder="Ex.: 78,5" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="measured-at">Data e hora</Label><Input id="measured-at" type="datetime-local" max={localDateTime()} value={measuredAt} onChange={(event) => setMeasuredAt(event.target.value)} required /></div><div className="flex gap-2"><Button disabled={saving} type="submit">{saving ? 'Salvando…' : editingId ? 'Atualizar' : 'Registrar'}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setWeightKg(''); setMeasuredAt(localDateTime()); }}>Cancelar</Button>}</div></form></CardContent></Card>
    <section><h2 className="mb-3 text-xl font-semibold">Histórico</h2>{loading ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Carregando pesos…</CardContent></Card> : entries.length === 0 ? <Card className="border-dashed"><CardContent className="grid justify-items-center py-10 text-center"><Scale className="mb-3 size-8 text-primary" /><p className="font-medium">Nenhum peso registrado</p><p className="mt-1 text-sm text-muted-foreground">Seu histórico será construído a partir do primeiro registro.</p></CardContent></Card> : <div className="space-y-3">{entries.map((entry) => <Card key={entry.id}><CardContent className="flex items-center justify-between py-4"><div><p className="text-lg font-semibold">{formatWeight(Number(entry.weight_kg))}</p><p className="text-sm text-muted-foreground">{formatDate(entry.measured_at)} · {entry.source === 'manual' ? 'Manual' : 'Inicial'}</p></div><div className="flex"><Button variant="ghost" size="icon" aria-label="Editar peso" onClick={() => edit(entry)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" aria-label="Excluir peso" onClick={() => void remove(entry.id)}><Trash2 className="size-4 text-destructive" /></Button></div></CardContent></Card>)}</div>}</section>
  </div>;
}
