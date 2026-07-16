import { cn } from '@/lib/utils';

const styles = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-amber-100 text-amber-800',
  ready: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-slate-100 text-slate-600',
  failed: 'bg-red-100 text-red-700',
} as const;

const labels = { pending: 'Gerando', processing: 'Gerando', ready: 'Pronto', expired: 'Expirado', failed: 'Erro' } as const;

export type ReportStatus = keyof typeof labels;

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <span className={cn('inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold', styles[status])}>{labels[status]}</span>;
}
