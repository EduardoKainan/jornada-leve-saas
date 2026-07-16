import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';

export default function RecoveryPage() {
  return <div><h1 className="text-3xl font-bold tracking-tight">Recupere seu acesso</h1><p className="mt-2 mb-8 text-muted-foreground">Informe seu e-mail e enviaremos um link seguro.</p><AuthForm mode="recovery" /><p className="mt-6 text-center text-sm"><Link className="text-primary hover:underline" href="/entrar">Voltar para entrar</Link></p></div>;
}