'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Copy, CreditCard, LoaderCircle, X } from 'lucide-react';
import { PlanCard } from '@/components/billing/plan-card';
import { SubscriptionStatusBadge } from '@/components/billing/subscription-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PlanDefinition } from '@/lib/sprint4';
import { trialDaysRemaining } from '@/lib/sprint4';

type Subscription = { plan_code: string; status: string; trial_ends_at: string | null };
type PageData = { plans: readonly PlanDefinition[]; subscription: Subscription | null };
type PixPayment = { txid: string; qrCodeImage: string; pixCopiaECola: string };

export default function PlansPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setError('');
    try {
      const [plansResponse, statusResponse] = await Promise.all([fetch('/api/plans'), fetch('/api/subscriptions/status', { cache: 'no-store' })]);
      if (!plansResponse.ok || !statusResponse.ok) throw new Error('Não foi possível carregar os planos.');
      const plansBody = await plansResponse.json() as { plans: readonly PlanDefinition[] };
      const statusBody = await statusResponse.json() as { subscription: Subscription | null };
      setData({ plans: plansBody.plans, subscription: statusBody.subscription });
      return statusBody.subscription;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ocorreu um erro inesperado.');
      return null;
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!pixPayment) return;
    const interval = window.setInterval(() => {
      void load().then((subscription) => {
        if (subscription?.status === 'active') setPixPayment(null);
      });
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [pixPayment]);

  async function subscribe(planCode: PlanDefinition['code']) {
    setSubmitting(planCode);
    setError('');
    try {
      const response = await fetch('/api/subscriptions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ planCode }) });
      const body = await response.json() as Partial<PixPayment> & { error?: string };
      if (!response.ok) throw new Error(body.error || 'Não foi possível iniciar a assinatura.');
      if (body.txid && body.qrCodeImage && body.pixCopiaECola) {
        setPixPayment({ txid: body.txid, qrCodeImage: body.qrCodeImage, pixCopiaECola: body.pixCopiaECola });
      } else {
        await load();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível assinar.');
    } finally {
      setSubmitting(null);
    }
  }

  async function copyPixCode() {
    if (!pixPayment) return;
    await navigator.clipboard.writeText(pixPayment.pixCopiaECola);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  if (!data && !error) return <div className="animate-pulse space-y-6"><div className="h-20 rounded-2xl bg-muted" /><div className="grid gap-5 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-[430px] rounded-2xl bg-muted" />)}</div></div>;
  if (!data) return <Card><CardContent className="flex flex-col items-center gap-4 py-12 text-center"><AlertCircle className="size-10 text-destructive" /><p>{error}</p><Button onClick={load}>Tentar novamente</Button></CardContent></Card>;

  const subscription = data.subscription;
  const days = subscription?.status === 'trialing' ? trialDaysRemaining(subscription.trial_ends_at) : 0;
  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-primary">Assinatura</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Escolha seu plano</h1><p className="mt-2 max-w-2xl text-muted-foreground">Cuide da sua evolução com todos os recursos da Jornada Leve.</p></div><Link href="/app/cobranca" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><CreditCard className="size-4" /> Ver cobrança <ArrowRight className="size-4" /></Link></div>
    {subscription && <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4"><SubscriptionStatusBadge status={subscription.status} /><p className="text-sm">{subscription.status === 'trialing' ? (days > 0 ? `Seu período gratuito termina em ${days} ${days === 1 ? 'dia' : 'dias'}.` : 'Seu período gratuito terminou.') : `Plano atual: ${subscription.plan_code === 'annual' ? 'Anual' : subscription.plan_code === 'monthly' ? 'Mensal' : 'Gratuito'}.`}</p></div>}
    {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <div className="grid items-stretch gap-5 lg:grid-cols-3">{data.plans.map((plan) => <PlanCard key={plan.code} plan={plan} active={subscription?.plan_code === plan.code && ['active', 'trialing', 'grace_period', 'canceled_end_of_period'].includes(subscription.status)} loading={submitting === plan.code} onSubscribe={subscribe} />)}</div>
    <p className="text-center text-xs text-muted-foreground">Pagamento seguro via PIX processado pela Efí.</p>

    {pixPayment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="pix-title">
      <div className="relative max-h-[95vh] w-full max-w-md overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
        <button type="button" aria-label="Fechar" onClick={() => setPixPayment(null)} className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
        <div className="space-y-5 text-center">
          <div><h2 id="pix-title" className="text-2xl font-bold">Pague via PIX</h2><p className="mt-1 text-sm text-muted-foreground">Pague via PIX em qualquer banco</p></div>
          <img src={pixPayment.qrCodeImage} alt="QR Code PIX para pagamento" className="mx-auto size-64 max-w-full rounded-xl border bg-white p-2" />
          <div className="space-y-2 text-left"><label htmlFor="pix-code" className="text-sm font-medium">Código PIX copia e cola</label><div className="flex gap-2"><input id="pix-code" readOnly value={pixPayment.pixCopiaECola} className="min-w-0 flex-1 rounded-xl border bg-muted px-3 py-2 text-xs" /><Button type="button" variant="outline" onClick={() => void copyPixCode()}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}<span className="sr-only">Copiar código PIX</span></Button></div></div>
          <div className="flex items-center justify-center gap-2 rounded-xl bg-muted p-3 text-sm font-medium"><LoaderCircle className="size-4 animate-spin text-primary" />Aguardando pagamento...</div>
          <p className="text-xs text-muted-foreground">A confirmação é automática. Esta tela será atualizada assim que o pagamento for identificado.</p>
        </div>
      </div>
    </div>}
  </div>;
}
