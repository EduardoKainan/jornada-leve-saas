import Link from 'next/link';
import { ChevronRight, ClipboardCheck, Ruler, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const choices = [
  { href: '/app/check-in', title: 'Check-in diário', description: 'Fome, energia, sono, atividade e sintomas.', icon: ClipboardCheck },
  { href: '/app/peso', title: 'Peso', description: 'Registre ou atualize seu peso.', icon: Scale },
  { href: '/app/medidas', title: 'Medidas', description: 'Cintura, abdômen, quadril e outras.', icon: Ruler },
];
export default function RegisterPage() { return <div className="space-y-6"><header><p className="text-sm text-muted-foreground">O que deseja acompanhar?</p><h1 className="text-2xl font-bold sm:text-3xl">Novo registro</h1></header><div className="grid gap-4 sm:grid-cols-3">{choices.map(({ href, title, description, icon: Icon }) => <Link href={href} key={href}><Card className="h-full transition-colors hover:border-primary"><CardContent className="flex h-full items-start gap-4 py-6"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10"><Icon className="size-5 text-primary" /></div><div className="min-w-0 flex-1"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><ChevronRight className="mt-2 size-4 text-muted-foreground" /></CardContent></Card></Link>)}</div></div>; }
