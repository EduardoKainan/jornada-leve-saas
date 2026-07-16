import { LoaderCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ReportsLoading() {
  return <div className="space-y-6"><div className="space-y-2"><div className="h-4 w-52 animate-pulse rounded bg-muted" /><div className="h-9 w-40 animate-pulse rounded bg-muted" /></div><Card><CardContent className="flex min-h-64 items-center justify-center"><div className="text-center"><LoaderCircle className="mx-auto size-8 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Carregando relatórios…</p></div></CardContent></Card></div>;
}
