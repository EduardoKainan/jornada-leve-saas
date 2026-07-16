import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';

export default function LoginPage() {
  return <div><h1 className="text-3xl font-bold tracking-tight">Que bom ter você de volta</h1><p className="mt-2 mb-8 text-muted-foreground">Entre para continuar sua jornada.</p><AuthForm mode="login" /><p className="mt-6 text-center text-sm text-muted-foreground">Ainda não tem conta? <Link className="font-medium text-primary hover:underline" href="/cadastro">Começar agora</Link></p></div>;
}