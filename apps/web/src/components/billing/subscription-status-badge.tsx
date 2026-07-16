import { cn } from '@/lib/utils';

const labels: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Período gratuito',
  past_due: 'Pagamento pendente',
  grace_period: 'Em regularização',
  canceled: 'Cancelada',
  expired: 'Vencida',
  canceled_end_of_period: 'Cancelamento agendado',
};

export function SubscriptionStatusBadge({ status, className }: { status: string; className?: string }) {
  const success = status === 'active';
  const warning = status === 'trialing' || status === 'grace_period' || status === 'canceled_end_of_period';
  return <span className={cn(
    'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold',
    success && 'bg-emerald-100 text-emerald-800',
    warning && 'bg-amber-100 text-amber-800',
    !success && !warning && 'bg-rose-100 text-rose-800',
    className,
  )}>{labels[status] ?? status}</span>;
}
