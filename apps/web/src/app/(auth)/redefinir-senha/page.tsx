'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Senha atualizada.'); router.replace('/app'); router.refresh();
  }
  return <div><h1 className="text-3xl font-bold">Crie uma nova senha</h1><p className="mt-2 mb-8 text-muted-foreground">Escolha uma senha com pelo menos 8 caracteres.</p><form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="password">Nova senha</Label><Input id="password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div><Button className="w-full" disabled={loading}>Salvar nova senha</Button></form></div>;
}