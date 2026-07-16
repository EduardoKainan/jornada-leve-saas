import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';

export default function SignupPage() {
  return <div><h1 className="text-3xl font-bold tracking-tight">Comece sua jornada</h1><p className="mt-2 mb-8 text-muted-foreground">Crie sua conta em poucos segundos.</p><AuthForm mode="signup" /><p className="mt-6 text-center text-sm text-muted-foreground">Já tem conta? <Link className="font-medium text-primary hover:underline" href="/entrar">Entrar</Link></p></div>;
}