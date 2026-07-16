'use client';

import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function FoodTipsError({ reset }: { reset: () => void }) {
  return (
    <Card role="alert">
      <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
        <CircleAlert aria-hidden="true" className="mb-4 size-10 text-destructive" />
        <h1 className="text-lg font-semibold">Não foi possível carregar as dicas</h1>
        <p className="mt-2 text-sm text-muted-foreground">Confira sua conexão e tente novamente.</p>
        <Button className="mt-5" onClick={reset}>Tentar novamente</Button>
      </CardContent>
    </Card>
  );
}
