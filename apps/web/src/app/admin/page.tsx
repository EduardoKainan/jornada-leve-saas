import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  CheckCircle2,
  CreditCard,
  Database,
  FileText,
  LockKeyhole,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const SUPERADMIN_ROLES = ['super_admin', 'security_admin'];
const ACTIVE_STATUSES = ['trialing', 'active', 'grace_period', 'canceled_end_of_period'];
const PAID_STATUSES = ['active', 'grace_period', 'canceled_end_of_period'];

type AdminUser = { role: string; active: boolean };
type ProfileRow = {
  id: string;
  display_name: string | null;
  onboarding_status: string | null;
  height_cm: number | string | null;
  created_at: string | null;
  deleted_at?: string | null;
};
type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_code: string | null;
  status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string | null;
  updated_at: string | null;
};
type PaymentEventRow = {
  id: string;
  event_type: string | null;
  signature_valid: boolean | null;
  outcome: string | null;
  processed_at: string | null;
  created_at: string | null;
};
type ReportJobRow = { id: string; status: string | null; created_at: string | null; expires_at: string | null };
type PrivacyRequestRow = { id: string; request_type: string | null; status: string | null; requested_at: string | null };
type NotificationJobRow = { id: string; event_type: string | null; status: string | null; scheduled_at: string | null };

type AuthUserSummary = { id: string; email: string | null; lastSignInAt: string | null; createdAt: string | null };

type MetricProps = {
  icon: typeof Users;
  label: string;
  value: string | number;
  description: string;
  tone?: 'default' | 'good' | 'warn';
};

function currency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function date(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function statusTone(status: string | null | undefined) {
  if (!status) return 'bg-muted text-muted-foreground';
  if (['active', 'trialing', 'ready', 'sent', 'completed', 'grace_period'].includes(status)) return 'bg-emerald-500/10 text-emerald-700';
  if (['past_due', 'pending', 'processing', 'in_progress'].includes(status)) return 'bg-amber-500/10 text-amber-700';
  if (['failed', 'canceled', 'expired'].includes(status)) return 'bg-destructive/10 text-destructive';
  return 'bg-muted text-muted-foreground';
}

function planPriceCents(planCode: string | null | undefined) {
  if (planCode === 'monthly') return 2990;
  if (planCode === 'annual') return Math.round(24990 / 12);
  return 0;
}

function groupCount<T extends string | null | undefined>(items: { status?: T }[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = item.status || 'sem_status';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function Metric({ icon: Icon, label, value, description, tone = 'default' }: MetricProps) {
  const toneClass = tone === 'good' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-foreground';
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardDescription className="flex items-center gap-2"><Icon className="size-4" />{label}</CardDescription>
        <CardTitle className={`text-3xl ${toneClass}`}>{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</CardTitle>
      </CardHeader>
      <CardContent><p className="text-xs text-muted-foreground">{description}</p></CardContent>
    </Card>
  );
}

function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

async function getAdminData() {
  const service = createAdminClient();
  const [
    profilesResult,
    subscriptionsResult,
    recentProfilesResult,
    recentSubscriptionsResult,
    paymentEventsResult,
    reportJobsResult,
    privacyRequestsResult,
    notificationJobsResult,
    authUsersResult,
  ] = await Promise.all([
    service.from('profiles').select('id, onboarding_status, created_at, deleted_at').is('deleted_at', null).limit(1000),
    service.from('subscriptions').select('id, user_id, plan_code, status, trial_ends_at, current_period_end, created_at, updated_at').order('created_at', { ascending: false }).limit(1000),
    service.from('profiles').select('id, display_name, onboarding_status, height_cm, created_at, deleted_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(8),
    service.from('subscriptions').select('id, user_id, plan_code, status, trial_ends_at, current_period_end, created_at, updated_at').order('created_at', { ascending: false }).limit(10),
    service.from('payment_events').select('id, event_type, signature_valid, outcome, processed_at, created_at').order('created_at', { ascending: false }).limit(8),
    service.from('report_jobs').select('id, status, created_at, expires_at').order('created_at', { ascending: false }).limit(8),
    service.from('privacy_requests').select('id, request_type, status, requested_at').order('requested_at', { ascending: false }).limit(8),
    service.from('notification_jobs').select('id, event_type, status, scheduled_at').order('scheduled_at', { ascending: true }).limit(8),
    service.auth.admin.listUsers({ page: 1, perPage: 20 }),
  ]);

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
  const recentProfiles = (recentProfilesResult.data ?? []) as ProfileRow[];
  const recentSubscriptions = (recentSubscriptionsResult.data ?? []) as SubscriptionRow[];
  const paymentEvents = (paymentEventsResult.data ?? []) as PaymentEventRow[];
  const reportJobs = (reportJobsResult.data ?? []) as ReportJobRow[];
  const privacyRequests = (privacyRequestsResult.data ?? []) as PrivacyRequestRow[];
  const notificationJobs = (notificationJobsResult.data ?? []) as NotificationJobRow[];
  const authUsers: AuthUserSummary[] = (authUsersResult.data.users ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    createdAt: user.created_at ?? null,
  }));

  const payingSubscriptions = subscriptions.filter((item) => PAID_STATUSES.includes(item.status ?? '') && item.plan_code !== 'trial');
  const activeSubscriptions = subscriptions.filter((item) => ACTIVE_STATUSES.includes(item.status ?? ''));
  const pendingPayments = subscriptions.filter((item) => item.status === 'past_due').length;
  const mrrCents = payingSubscriptions.reduce((total, item) => total + planPriceCents(item.plan_code), 0);
  const annualActive = payingSubscriptions.filter((item) => item.plan_code === 'annual').length;
  const monthlyActive = payingSubscriptions.filter((item) => item.plan_code === 'monthly').length;
  const onboardingCompleted = profiles.filter((item) => item.onboarding_status === 'completed').length;
  const conversionRate = profiles.length > 0 ? Math.round((activeSubscriptions.length / profiles.length) * 100) : 0;

  return {
    profiles,
    subscriptions,
    recentProfiles,
    recentSubscriptions,
    paymentEvents,
    reportJobs,
    privacyRequests,
    notificationJobs,
    authUsers,
    metrics: {
      users: profiles.length,
      authUsers: authUsersResult.data.users.length,
      subscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      pendingPayments,
      mrrCents,
      annualActive,
      monthlyActive,
      onboardingCompleted,
      conversionRate,
    },
    subscriptionStatus: groupCount(subscriptions),
    reportStatus: groupCount(reportJobs),
    notificationStatus: groupCount(notificationJobs),
    envHealth: [
      { label: 'Supabase service role', ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
      { label: 'Efí PIX client', ok: Boolean(process.env.EFI_PIX_CLIENT_ID && process.env.EFI_PIX_CLIENT_SECRET) },
      { label: 'Chave PIX', ok: Boolean(process.env.PIX_KEY) },
      { label: 'Certificado PIX base64', ok: Boolean(process.env.EFI_PIX_CERT_BASE64) },
      { label: 'URL pública', ok: Boolean(process.env.NEXT_PUBLIC_APP_URL) },
    ],
  };
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar?next=/admin');

  const service = createAdminClient();
  const { data: admin } = await service
    .from('admin_users')
    .select('role, active')
    .eq('auth_user_id', user.id)
    .eq('active', true)
    .maybeSingle<AdminUser>();

  if (!admin) redirect('/app');
  if (!SUPERADMIN_ROLES.includes(admin.role)) redirect('/app');

  const data = await getAdminData();
  const { metrics } = data;

  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 rounded-3xl border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck className="size-4" /> Painel Superadmin</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Gestão do SaaS Jornada Leve</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">Visão de usuários, assinaturas, receita estimada, filas operacionais, privacidade, pagamentos e saúde de integrações.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill className="bg-primary/10 text-primary">{admin.role}</Pill>
            <Pill className="bg-emerald-500/10 text-emerald-700">ambiente produção</Pill>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Users} label="Usuários ativos" value={metrics.users} description={`${metrics.authUsers} usuários no Auth listados na primeira página`} />
          <Metric icon={CreditCard} label="Assinaturas ativas/teste" value={metrics.activeSubscriptions} description={`${metrics.pendingPayments} cobrança(s) pendente(s)`} tone={metrics.pendingPayments > 0 ? 'warn' : 'good'} />
          <Metric icon={TrendingUp} label="MRR estimado" value={currency(metrics.mrrCents)} description={`${metrics.monthlyActive} mensal · ${metrics.annualActive} anual rateado`} tone="good" />
          <Metric icon={BarChart3} label="Conversão base→acesso" value={`${metrics.conversionRate}%`} description={`${metrics.onboardingCompleted} onboarding(s) concluídos`} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Section title="Funil e assinaturas" description="Status comercial atual para decidir cobrança, suporte ou crescimento.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(data.subscriptionStatus).map(([status, count]) => <div key={status} className="rounded-2xl border p-4"><Pill className={statusTone(status)}>{status}</Pill><p className="mt-3 text-2xl font-bold">{count}</p></div>)}
            </div>
          </Section>

          <Section title="Saúde técnica" description="Checklist rápido de variáveis críticas do SaaS.">
            <div className="space-y-3">
              {data.envHealth.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm"><span>{item.label}</span>{item.ok ? <CheckCircle2 className="size-5 text-emerald-600" /> : <AlertTriangle className="size-5 text-amber-600" />}</div>)}
            </div>
          </Section>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <Section title="Usuários recentes" description="Novas contas e estágio de onboarding.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Usuário</th><th>Status</th><th>Altura</th><th>Criado em</th></tr></thead>
                <tbody className="divide-y">
                  {data.recentProfiles.map((profile) => <tr key={profile.id}><td className="py-3"><p className="font-medium">{profile.display_name || 'Sem nome'}</p><p className="text-xs text-muted-foreground">{shortId(profile.id)}</p></td><td><Pill className={statusTone(profile.onboarding_status)}>{profile.onboarding_status || '—'}</Pill></td><td>{profile.height_cm ? `${profile.height_cm} cm` : '—'}</td><td>{date(profile.created_at)}</td></tr>)}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Assinaturas recentes" description="Últimas tentativas, planos e vencimentos.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Plano</th><th>Status</th><th>Usuário</th><th>Período</th><th>Criado em</th></tr></thead>
                <tbody className="divide-y">
                  {data.recentSubscriptions.map((subscription) => <tr key={subscription.id}><td className="py-3 font-medium">{subscription.plan_code || '—'}</td><td><Pill className={statusTone(subscription.status)}>{subscription.status || '—'}</Pill></td><td className="text-xs text-muted-foreground">{shortId(subscription.user_id)}</td><td>{date(subscription.current_period_end || subscription.trial_ends_at)}</td><td>{date(subscription.created_at)}</td></tr>)}
                </tbody>
              </table>
            </div>
          </Section>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <Section title="Pagamentos" description="Eventos Efí/webhook mais recentes.">
            <div className="space-y-3">
              {data.paymentEvents.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p> : data.paymentEvents.map((event) => <div key={event.id} className="rounded-2xl border p-3"><div className="flex items-center justify-between gap-3"><p className="font-medium">{event.event_type || 'evento'}</p><Pill className={event.signature_valid ? 'bg-emerald-500/10 text-emerald-700' : 'bg-destructive/10 text-destructive'}>{event.signature_valid ? 'assinatura ok' : 'sem assinatura'}</Pill></div><p className="mt-1 text-xs text-muted-foreground">{event.outcome || 'sem resultado'} · {date(event.processed_at || event.created_at)}</p></div>)}
            </div>
          </Section>

          <Section title="Relatórios" description="Fila de geração e expiração de PDFs.">
            <div className="mb-4 flex flex-wrap gap-2">{Object.entries(data.reportStatus).map(([status, count]) => <Pill key={status} className={statusTone(status)}>{status}: {count}</Pill>)}</div>
            <div className="space-y-3">
              {data.reportJobs.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum relatório recente.</p> : data.reportJobs.map((job) => <div key={job.id} className="rounded-2xl border p-3"><p className="font-medium">Relatório {shortId(job.id)}</p><p className="text-xs text-muted-foreground">{job.status || '—'} · criado {date(job.created_at)}</p></div>)}
            </div>
          </Section>

          <Section title="Filas e privacidade" description="Pendências operacionais que exigem atenção.">
            <div className="space-y-5">
              <div><p className="mb-2 flex items-center gap-2 text-sm font-semibold"><BellRing className="size-4" /> Notificações</p><div className="flex flex-wrap gap-2">{Object.entries(data.notificationStatus).map(([status, count]) => <Pill key={status} className={statusTone(status)}>{status}: {count}</Pill>)}</div></div>
              <div><p className="mb-2 flex items-center gap-2 text-sm font-semibold"><LockKeyhole className="size-4" /> LGPD</p><div className="space-y-2">{data.privacyRequests.length === 0 ? <p className="text-sm text-muted-foreground">Sem solicitações recentes.</p> : data.privacyRequests.map((request) => <div key={request.id} className="rounded-xl border p-3 text-sm"><span className="font-medium">{request.request_type}</span> <Pill className={statusTone(request.status)}>{request.status}</Pill><p className="mt-1 text-xs text-muted-foreground">{date(request.requested_at)}</p></div>)}</div></div>
            </div>
          </Section>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <Section title="Auth users" description="Primeiros usuários retornados pelo Supabase Auth Admin.">
            <div className="space-y-3">
              {data.authUsers.map((authUser) => <div key={authUser.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3"><div><p className="font-medium">{authUser.email || 'sem e-mail'}</p><p className="text-xs text-muted-foreground">{shortId(authUser.id)} · criado {date(authUser.createdAt)}</p></div><p className="text-right text-xs text-muted-foreground">último login<br />{date(authUser.lastSignInAt)}</p></div>)}
            </div>
          </Section>

          <Section title="Decisões rápidas" description="O que olhar primeiro na operação do SaaS.">
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionCard icon={CreditCard} title="Cobrança" text={metrics.pendingPayments > 0 ? `${metrics.pendingPayments} assinatura(s) aguardando pagamento.` : 'Sem cobrança pendente no recorte atual.'} />
              <ActionCard icon={Database} title="Dados" text={`${metrics.users} perfis ativos e ${metrics.onboardingCompleted} onboardings concluídos.`} />
              <ActionCard icon={FileText} title="Relatórios" text={`${data.reportJobs.filter((job) => job.status === 'failed').length} falha(s) recente(s) de relatório.`} />
              <ActionCard icon={Activity} title="Eventos" text={`${data.paymentEvents.length} evento(s) de pagamento no painel.`} />
            </div>
          </Section>
        </section>
      </div>
    </main>
  );
}

function ActionCard({ icon: Icon, title, text }: { icon: typeof Users; title: string; text: string }) {
  return <div className="rounded-2xl border bg-background p-4"><Icon className="mb-3 size-5 text-primary" /><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>;
}
