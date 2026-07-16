import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlanDefinition } from '@/lib/sprint4';
import { cn } from '@/lib/utils';

function price(plan: PlanDefinition) {
  if (plan.priceCents === 0) return 'Grátis';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.priceCents / 100);
}

export function PlanCard({ plan, active, loading, onSubscribe }: {
  plan: PlanDefinition;
  active: boolean;
  loading: boolean;
  onSubscribe: (code: PlanDefinition['code']) => void;
}) {
  return <Card className={cn('relative flex h-full flex-col overflow-hidden', plan.recommended && 'border-primary shadow-lg ring-1 ring-primary')}>
    {plan.recommended && <div className="flex items-center justify-center gap-2 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"><Sparkles className="size-4" /> Plano recomendado</div>}
    <CardHeader>
      <div className="flex items-start justify-between gap-3">
        <CardTitle>{plan.name}</CardTitle>
        {plan.badge && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{plan.badge}</span>}
      </div>
      <CardDescription>{plan.description}</CardDescription>
      <div className="pt-4"><span className="text-3xl font-bold tracking-tight">{price(plan)}</span>{plan.priceCents > 0 && <span className="text-sm text-muted-foreground"> / {plan.code === 'annual' ? 'ano' : 'mês'}</span>}</div>
    </CardHeader>
    <CardContent className="flex flex-1 flex-col">
      <ul className="mb-6 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{feature}</span></li>)}</ul>
      <Button className="mt-auto w-full" variant={plan.recommended ? 'default' : 'outline'} disabled={active || loading} onClick={() => onSubscribe(plan.code)}>
        {active ? 'Assinatura ativa' : loading ? 'Aguarde…' : plan.code === 'trial' ? 'Começar grátis' : 'Assinar'}
      </Button>
    </CardContent>
  </Card>;
}
