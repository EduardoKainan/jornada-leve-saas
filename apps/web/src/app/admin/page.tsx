import { redirect } from 'next/navigation';
import { Activity, CreditCard, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar?next=/admin');
  const { data: admin } = await supabase.from('admin_users').select('role, active').eq('auth_user_id', user.id).eq('active', true).maybeSingle();
  if (!admin) redirect('/app');
  const service = createAdminClient();
  const [{ count: users }, { count: subscriptions }, { count: activeSubscriptions }] = await Promise.all([
    service.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    service.from('subscriptions').select('id', { count: 'exact', head: true }),
    service.from('subscriptions').select('id', { count: 'exact', head: true }).in('status', ['trialing', 'active']),
  ]);
  return <main className="min-h-dvh bg-muted/30 px-4 py-8 sm:px-8"><div className="mx-auto max-w-5xl"><header className="mb-8 flex items-start justify-between"><div><p className="flex items-center gap-2 text-sm text-primary"><ShieldCheck className="size-4" /> Área restrita</p><h1 className="mt-1 text-3xl font-bold">Status operacional</h1><p className="mt-2 text-muted-foreground">Visão mínima do ambiente Jornada Leve.</p></div><span className="rounded-full border bg-card px-3 py-1 text-xs">{admin.role}</span></header><section className="grid gap-4 sm:grid-cols-3"><Metric icon={Users} label="Usuários" value={users ?? 0} description="Perfis ativos" /><Metric icon={CreditCard} label="Assinaturas" value={subscriptions ?? 0} description="Total no sistema" /><Metric icon={Activity} label="Ativas ou em teste" value={activeSubscriptions ?? 0} description="Saúde comercial" /></section></div></main>;
}
function Metric({ icon: Icon, label, value, description }: { icon: typeof Users; label: string; value: number; description: string }) { return <Card><CardHeader className="pb-3"><CardDescription className="flex items-center gap-2"><Icon className="size-4" />{label}</CardDescription><CardTitle className="text-3xl">{value.toLocaleString('pt-BR')}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">{description}</p></CardContent></Card>; }