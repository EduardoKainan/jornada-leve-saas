'use client';

import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ReportsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Card><CardContent className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><CircleAlert className="mb-4 size-10 text-destructive" /><h1 className="text-lg font-semibold">Não foi possível abrir os relatórios</h1><p className="mt-2 text-sm text-muted-foreground">Tente carregar a página novamente.</p><Button className="mt-5" onClick={reset}>Tentar novamente</Button></CardContent></Card>;
}
