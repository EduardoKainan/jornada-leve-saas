import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh bg-muted/30 lg:grid-cols-2">
      <section className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold"><Leaf className="size-6" /> Jornada Leve</Link>
        <div className="max-w-md">
          <p className="text-3xl font-semibold leading-tight">Pequenos registros. Uma visão mais leve da sua evolução.</p>
          <p className="mt-4 text-primary-foreground/75">Seus dados de saúde são privados e ficam sob seu controle.</p>
        </div>
        <p className="text-sm text-primary-foreground/60">Acompanhamento não substitui orientação médica.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center justify-center gap-2 text-lg font-semibold lg:hidden"><Leaf className="size-6 text-primary" /> Jornada Leve</Link>
          {children}
        </div>
      </section>
    </main>
  );
}