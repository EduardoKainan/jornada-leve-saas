'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CreditCard, ReceiptText, RefreshCw } from 'lucide-react';
import { CancelSubscriptionModal } from '@/components/billing/cancel-subscription-modal';
import { SubscriptionStatusBadge } from '@/components/billing/subscription-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Subscription = { plan_code: string; status: string; trial_ends_at: string | null; current_period_end: string | null };
type EventDetails = { amountCents?: number | null; paymentMethod?: string | null; cardLast4?: string | null; status?: string };
type PaymentEvent = { id: string; event_type: string; created_at: string; details: EventDetails | null };
type BillingData = { subscription: Subscription | null; events: PaymentEvent[] };

const eventLabels: Record<string, string> = { charge_confirmed: 'Pagamento confirmado', charge_failed: 'Pagamento não processado', charge_canceled: 'Cobrança cancelada', subscription_canceled: 'Assinatura cancelada' };
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—'; }
function formatMoney(cents?: number | null) { return typeof cents === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100) : '—'; }

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/subscriptions/status', { cache: 'no-store' });
      const body = await response.json() as BillingData & { error?: string };
      if (!response.ok) throw new Error(body.error || 'Não foi possível carregar a cobrança.');
      setData(body);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Ocorreu um erro inesperado.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const payment = useMemo(() => data?.events.find((event) => event.details?.paymentMethod || event.details?.cardLast4), [data]);

  async function cancel() {
    setCanceling(true); setError('');
    try {
      const response = await fetch('/api/subscriptions/cancel', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmation: 'CANCELAR' }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Não foi possível cancelar.');
      setModal(false); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível cancelar.'); }
    finally { setCanceling(false); }
  }

  if (!data && !error) return <div className="animate-pulse space-y-5"><div className="h-28 rounded-2xl bg-muted" /><div className="grid gap-5 md:grid-cols-2"><div className="h-48 rounded-2xl bg-muted" /><div className="h-48 rounded-2xl bg-muted" /></div><div className="h-60 rounded-2xl bg-muted" /></div>;
  if (!data) return <Card><CardContent className="flex flex-col items-center gap-4 py-12 text-center"><AlertCircle className="size-10 text-destructive" /><p>{error}</p><Button onClick={load}>Tentar novamente</Button></CardContent></Card>;
  if (!data.subscription) return <div className="space-y-6"><div><h1 className="text-3xl font-bold tracking-tight">Cobrança</h1><p className="mt-2 text-muted-foreground">Gerencie sua assinatura e seus pagamentos.</p></div><Card><CardContent className="flex flex-col items-center gap-4 py-12 text-center"><ReceiptText className="size-10 text-muted-foreground" /><div><h2 className="font-semibold">Nenhuma assinatura ainda</h2><p className="mt-1 text-sm text-muted-foreground">Escolha um plano para começar.</p></div><Link href="/app/plano" className="inline-flex h-11 items-center rounded-xl bg-primary px-4 font-medium text-primary-foreground">Ver planos</Link></CardContent></Card></div>;

  const subscription = data.subscription;
  const cancelable = !['canceled', 'expired'].includes(subscription.status);
  return <div className="space-y-6">
    <div><p className="text-sm font-semibold text-primary">Assinatura</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Cobrança</h1><p className="mt-2 text-muted-foreground">Acompanhe seus pagamentos e gerencie seu plano.</p></div>
    {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <div className="grid gap-5 md:grid-cols-2">
      <Card><CardHeader><CardDescription>Plano atual</CardDescription><div className="flex items-center justify-between gap-3"><CardTitle>{subscription.plan_code === 'annual' ? 'Anual' : subscription.plan_code === 'monthly' ? 'Mensal' : 'Gratuito'}</CardTitle><SubscriptionStatusBadge status={subscription.status} /></div></CardHeader><CardContent><p className="text-sm text-muted-foreground">Próximo vencimento</p><p className="mt-1 font-semibold">{formatDate(subscription.current_period_end ?? subscription.trial_ends_at)}</p></CardContent></Card>
      <Card><CardHeader><CardDescription>Método de pagamento</CardDescription><CardTitle className="flex items-center gap-2"><CreditCard className="size-5" /> {payment?.details?.paymentMethod === 'pix' ? 'Pix' : payment?.details?.cardLast4 ? `Cartão final ${payment.details.cardLast4}` : 'Não informado'}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Os dados completos ficam protegidos com a Efí e nunca são armazenados pela Jornada Leve.</p></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Histórico de pagamentos</CardTitle><CardDescription>Últimas movimentações da sua assinatura.</CardDescription></CardHeader><CardContent>{data.events.length === 0 ? <div className="flex flex-col items-center gap-2 py-8 text-center"><ReceiptText className="size-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th className="py-3 font-medium">Data</th><th className="py-3 font-medium">Descrição</th><th className="py-3 font-medium">Valor</th><th className="py-3 font-medium">Método</th></tr></thead><tbody>{data.events.map((event) => <tr key={event.id} className="border-b last:border-0"><td className="py-4">{formatDate(event.created_at)}</td><td className="py-4 font-medium">{eventLabels[event.event_type] ?? event.event_type}</td><td className="py-4">{formatMoney(event.details?.amountCents)}</td><td className="py-4">{event.details?.paymentMethod === 'credit_card' ? `Cartão •••• ${event.details.cardLast4 ?? ''}` : event.details?.paymentMethod ?? '—'}</td></tr>)}</tbody></table></div>}</CardContent></Card>
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">{cancelable ? <Button variant="destructive" onClick={() => setModal(true)}>Cancelar assinatura</Button> : <Link href="/app/plano" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-medium text-primary-foreground"><RefreshCw className="size-4" /> Reativar assinatura</Link>}</div>
    <CancelSubscriptionModal open={modal} loading={canceling} onClose={() => setModal(false)} onConfirm={cancel} />
  </div>;
}
