import { Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const foodTips = [
  {
    emoji: '🥗',
    title: 'Café da manhã leve',
    description: 'Fruta picada (mamão, banana, maçã) com aveia e mel. Ou tapioca recheada com queijo branco.',
  },
  {
    emoji: '🍛',
    title: 'Almoço equilibrado',
    description: 'Arroz, feijão, salada verde e proteína magra (frango, peixe, ovo).',
  },
  {
    emoji: '🥤',
    title: 'Hidratação',
    description: 'Água de coco, suco natural (limão, maracujá, acerola). Evitar refrigerante.',
  },
  {
    emoji: '🥜',
    title: 'Lanches inteligentes',
    description: 'Castanhas, iogurte natural, banana com pasta de amendoim.',
  },
  {
    emoji: '🍳',
    title: 'Jantar sem culpa',
    description: 'Omelete com legumes, caldo de legumes, creme de abóbora.',
  },
  {
    emoji: '✅',
    title: 'O que evitar',
    description: 'Frituras, embutidos, refrigerante, bebida alcoólica, doces industrializados.',
  },
] as const;

export default function FoodTipsPage() {
  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-primary">Cuide-se bem</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Dicas de Alimentação</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Escolhas simples e brasileiras para deixar sua rotina mais leve durante o tratamento.
        </p>
      </header>

      <section aria-label="Dicas por categoria" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {foodTips.map(({ emoji, title, description }) => (
          <Card key={title} className="h-full transition-colors hover:border-primary/30">
            <CardHeader className="pb-3">
              <div aria-hidden="true" className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                {emoji}
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <aside className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm" aria-label="Orientação profissional">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          <strong className="font-semibold text-foreground">Importante:</strong>{' '}
          <span className="text-muted-foreground">Consulte seu nutricionista para um plano alimentar adequado ao seu tratamento.</span>
        </p>
      </aside>
    </div>
  );
}
