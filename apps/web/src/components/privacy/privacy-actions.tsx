'use client';

import { useState } from 'react';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

async function message(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  return body.error ?? body.message ?? 'Não foi possível concluir a solicitação.';
}

export function PrivacyActions() {
  const [loading, setLoading] = useState<'export' | 'delete' | null>(null);
  const [confirmation, setConfirmation] = useState('');

  async function exportData() {
    setLoading('export');
    const response = await fetch('/api/privacy/export', { method: 'POST' });
    if (!response.ok) toast.error(await message(response));
    else {
      const result = await response.json() as { downloadUrl: string; emailed: boolean };
      const anchor = document.createElement('a');
      anchor.href = result.downloadUrl;
      anchor.rel = 'noopener';
      anchor.click();
      toast.success(result.emailed ? 'Exportação pronta e link enviado por e-mail.' : 'Exportação pronta para download.');
    }
    setLoading(null);
  }

  async function requestDeletion() {
    setLoading('delete');
    const response = await fetch('/api/privacy/delete-request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmation }) });
    if (!response.ok) toast.error(await message(response));
    else { toast.success(await message(response)); setConfirmation(''); }
    setLoading(null);
  }

  return <div className="grid gap-5 lg:grid-cols-2">
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Download className="size-5 text-primary" /> Exportar meus dados</CardTitle><CardDescription>Baixe um JSON com perfil, pesos, medidas, check-ins, consentimentos e assinaturas. O link expira em 48 horas.</CardDescription></CardHeader><CardContent><Button onClick={exportData} disabled={loading !== null}>{loading === 'export' ? 'Preparando...' : 'Gerar exportação'}</Button></CardContent></Card>
    <Card className="border-destructive/30"><CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="size-5" /> Solicitar exclusão</CardTitle><CardDescription>Enviaremos uma confirmação por e-mail antes de iniciar. Após confirmada, a solicitação será processada em até 15 dias, incluindo arquivos privados.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="delete-confirmation">Digite EXCLUIR para continuar</Label><Input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></div><Button variant="destructive" onClick={requestDeletion} disabled={confirmation !== 'EXCLUIR' || loading !== null}>{loading === 'delete' ? 'Enviando...' : 'Enviar confirmação por e-mail'}</Button></CardContent></Card>
    <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Seus direitos</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>Você pode solicitar acesso, correção, portabilidade e exclusão dos seus dados pessoais.</p><p>Para dúvidas ou solicitações adicionais, escreva para <a className="font-medium text-primary underline" href="mailto:privacidade@jornadaleve.com.br">privacidade@jornadaleve.com.br</a>.</p></CardContent></Card>
  </div>;
}
