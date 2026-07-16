'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { sanitizeNextPath } from '@/lib/onboarding';

type Mode = 'login' | 'signup' | 'recovery';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === 'recovery') {
        const callback = `${window.location.origin}/auth/callback?next=/redefinir-senha`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback });
        if (error) throw error;
        toast.success('Enviamos as instruções para o seu e-mail.');
        return;
      }
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            displayName: name.trim() || email.split('@')[0],
          }),
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Erro ao criar conta.');
        }

        // Login automático após criar a conta
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          toast.success('Conta criada! Faça login para continuar.');
          router.replace('/entrar');
          router.refresh();
        } else {
          toast.success('Conta criada com sucesso!');
          router.replace('/onboarding');
          router.refresh();
        }
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const next = sanitizeNextPath(new URLSearchParams(window.location.search).get('next'));
      router.replace(next);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível continuar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="name">Como podemos chamar você?</Label>
          <Input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      {mode !== 'recovery' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            {mode === 'login' && <Link className="text-xs text-primary hover:underline" href="/recuperar">Esqueci minha senha</Link>}
          </div>
          <Input id="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          {mode === 'signup' && <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>}
        </div>
      )}
      <Button className="w-full" size="lg" disabled={loading}>
        {loading && <LoaderCircle className="size-4 animate-spin" />}
        {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar minha conta' : 'Enviar instruções'}
      </Button>
    </form>
  );
}