'use client';

import { FilePlus2, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReportCard, type ReportListItem } from './report-card';
import { ReportConfig } from './report-config';

export function ReportList({ reports, loadError = false }: { reports: ReportListItem[]; loadError?: boolean }) {
  const router = useRouter();
  const [configOpen, setConfigOpen] = useState(false);
  const hasGenerating = reports.some((report) => report.status === 'pending' || report.status === 'processing');
  useEffect(() => {
    if (!hasGenerating) return;
    const timer = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [hasGenerating, router]);
  const changed = () => router.refresh();
  return <>
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">Documentos para suas consultas</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Relatórios</h1></div><Button onClick={() => setConfigOpen(true)}><FilePlus2 className="size-4" /><span className="hidden sm:inline">Novo relatório</span><span className="sm:hidden">Novo</span></Button></div>
    {loadError && <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar seus relatórios. Atualize a página.</div>}
    {!loadError && reports.length === 0 ? <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><FileText className="mb-4 size-10 text-primary" /><h2 className="text-lg font-semibold">Nenhum relatório gerado ainda</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Crie um PDF organizado para imprimir ou levar à sua próxima consulta.</p><Button className="mt-5" onClick={() => setConfigOpen(true)}>Criar primeiro relatório</Button></CardContent></Card> : reports.length > 0 && <section aria-label="Relatórios gerados" className="space-y-3"><div className="hidden grid-cols-[1.05fr_1.2fr_.7fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid"><span>Data e período</span><span>Seções</span><span>Status</span><span className="text-right">Ações</span></div>{reports.map((report) => <ReportCard key={report.id} report={report} onChanged={changed} />)}</section>}
    {configOpen && <div role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"><div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-background p-5 shadow-xl sm:max-w-2xl sm:rounded-3xl sm:p-7"><div className="mb-6 flex items-start justify-between gap-3"><div><h2 id="report-dialog-title" className="text-xl font-bold">Novo relatório</h2><p className="mt-1 text-sm text-muted-foreground">Configure o conteúdo do PDF para sua consulta.</p></div><Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setConfigOpen(false)}><X className="size-5" /></Button></div><ReportConfig onCancel={() => setConfigOpen(false)} onCreated={() => { setConfigOpen(false); router.refresh(); }} /></div></div>}
  </>;
}
