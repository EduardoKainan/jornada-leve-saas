'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, ChartNoAxesCombined, CircleUserRound, FileText, House, Leaf, LogOut, PlusCircle, WalletCards } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const items = [
  { href: '/app', label: 'Início', icon: House },
  { href: '/app/registrar', label: 'Registrar', icon: PlusCircle },
  { href: '/app/calendario', label: 'Calendário', icon: CalendarDays },
  { href: '/app/evolucao', label: 'Evolução', icon: ChartNoAxesCombined },
  { href: '/app/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/app/plano', label: 'Plano', icon: WalletCards },
  { href: '/app/conta', label: 'Conta', icon: CircleUserRound },
];

export function AppNav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  async function signOut() { await createClient().auth.signOut(); router.replace('/entrar'); router.refresh(); }
  return <>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card p-5 md:flex md:flex-col">
      <Link href="/app" className="mb-10 flex items-center gap-2 text-lg font-semibold"><Leaf className="size-6 text-primary" /> Jornada Leve</Link>
      <nav className="space-y-1">{items.map(({ href, label, icon: Icon }) => { const active = href === '/app' ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={cn('flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground', active && 'bg-primary/10 text-primary')}><Icon className="size-5" />{label}</Link>; })}</nav>
      <div className="mt-auto border-t pt-4"><p className="truncate px-3 text-sm font-medium">{name}</p><button onClick={signOut} className="mt-2 flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-accent"><LogOut className="size-4" /> Sair</button></div>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4.25rem+env(safe-area-inset-bottom))] items-start justify-around border-t bg-card px-1 pt-2 pb-[env(safe-area-inset-bottom)] md:hidden">{items.map(({ href, label, icon: Icon }) => { const active = href === '/app' ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={cn('flex min-w-0 flex-1 flex-col items-center gap-1 text-[9px] text-muted-foreground', active && 'text-primary')}><Icon className="size-5" /><span className="max-w-full truncate">{label}</span></Link>; })}</nav>
  </>;
}