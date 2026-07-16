import { ShareEvolutionActions } from '@/components/share/share-evolution-actions';
import { Card, CardContent } from '@/components/ui/card';

export default function ShareProgressPage() {
  return <div className="mx-auto max-w-3xl space-y-6">
    <header>
      <p className="text-sm text-muted-foreground">Celebre sua jornada</p>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Compartilhe sua evolução</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">Confira o card antes de compartilhar. Ele mostra apenas seus dados de evolução e nunca inclui informações de medicação.</p>
    </header>

    <Card className="overflow-hidden border-primary/20 shadow-sm">
      <CardContent className="p-3 sm:p-5">
        {/* A rota autenticada não pode passar pelo otimizador de imagens sem encaminhar a sessão. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/api/compartilhar/card"
          alt="Card quadrado com o resumo da sua evolução na Jornada Leve"
          width={1080}
          height={1080}
          className="aspect-square h-auto w-full rounded-xl bg-primary/10 object-cover"
        />
      </CardContent>
    </Card>

    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div className="mb-4 sm:mb-0">
        <h2 className="font-semibold">Seu progresso, do seu jeito</h2>
        <p className="mt-1 text-sm text-muted-foreground">Compartilhe pelo Instagram, WhatsApp ou salve o PNG no dispositivo.</p>
      </div>
      <ShareEvolutionActions showSave />
    </div>
  </div>;
}
