import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold">Jornada Leve</span>
        <div className="flex items-center gap-4">
          <Link
            href="/entrar"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Começar grátis
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Sua jornada de emagrecimento{' '}
          <span className="text-primary">organizada</span> em um só lugar
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Registre seu peso, medidas e sintomas. Acompanhe sua evolução com
          gráficos. Gere relatórios para suas consultas.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/cadastro"
            className="rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            Começar grátis — 7 dias
          </Link>
          <Link
            href="/precos"
            className="rounded-lg border border-input bg-background px-6 py-3 text-base font-medium hover:bg-accent"
          >
            Ver planos
          </Link>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
        <p>Jornada Leve — Organizando sua evolução com privacidade.</p>
      </footer>
    </div>
  );
}
