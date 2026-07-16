'use client';

import { Download, LoaderCircle, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReportStatusBadge, type ReportStatus } from './report-status-badge';

export type ReportListItem = {
  id: string;
  period_start: string;
  period_end: string;
  sections_json: string[];
  status: ReportStatus;
  expires_at: string | null;
  created_at: string;
};

const sectionLabels: Record<string, string> = { weight: 'Peso', measurements: 'Medidas', checkins: 'Check-ins', routines: 'Rotinas', appointments: 'Consultas' };
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));

export function ReportCard({ report, onChanged }: { report: ReportListItem; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generating = report.status === 'pending' || report.status === 'processing';
  async function action(kind: 'delete' | 'cancel') {
    if (kind === 'delete' && !window.confirm('Excluir este relatório permanentemente?')) return;
    setBusy(true); setError('');
    const response = await fetch(`/api/reports/${report.id}${kind === 'cancel' ? '/cancel' : ''}`, { method: kind === 'cancel' ? 'PATCH' : 'DELETE' });
    const body = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    if (!response.ok) { setError(body.error ?? 'Não foi possível concluir a ação.'); return; }
    onChanged();
  }
  return <Card className="overflow-hidden">
    <CardContent className="grid gap-4 p-4 sm:grid-cols-[1.05fr_1.2fr_.7fr_auto] sm:items-center sm:p-5">
      <div><p className="text-xs text-muted-foreground sm:hidden">Gerado em</p><p className="font-medium">{date(report.created_at)}</p><p className="mt-0.5 text-xs text-muted-foreground">{date(report.period_start)} a {date(report.period_end)}</p></div>
      <div><p className="text-xs text-muted-foreground sm:hidden">Seções</p><p className="text-sm">{report.sections_json.map((item) => sectionLabels[item] ?? item).join(', ')}</p></div>
      <ReportStatusBadge status={report.status} />
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {report.status === 'ready' && <a href={`/api/reports/${report.id}/download`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"><Download className="size-4" /> Baixar</a>}
        {generating && <Button variant="outline" size="sm" disabled={busy || report.status !== 'pending'} onClick={() => action('cancel')}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <XCircle className="size-4" />} Cancelar</Button>}
        <Button variant="ghost" size="icon" aria-label="Excluir relatório" disabled={busy || generating} onClick={() => action('delete')}><Trash2 className="size-4" /></Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive sm:col-span-4">{error}</p>}
    </CardContent>
  </Card>;
}
