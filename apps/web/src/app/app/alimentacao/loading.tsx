import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function FoodTipsLoading() {
  return (
    <div aria-busy="true" aria-label="Carregando dicas de alimentação" className="animate-pulse space-y-7">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-9 w-64 max-w-full rounded bg-muted" />
        <div className="h-5 w-full max-w-xl rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="size-11 rounded-xl bg-muted" />
              <div className="h-6 w-3/4 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-4 rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
