'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, KeyRound, Save, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type ReminderFrequency } from '@/lib/sprint3';
import { cn } from '@/lib/utils';

type Consent = { id: string; consent_type: string; version: string; granted: boolean; created_at: string };
type Preference = { enabled: boolean; local_time: string | null; quiet_days: string[] | null; timezone: string } | null;
type Props = { profile: { displayName: string; heightCm: number | null; email: string }; consents: Consent[]; preference: Preference };
const consentLabels: Record<string, string> = { terms: 'Termos de uso', privacy: 'Política de privacidade', sensitive_health_data: 'Tratamento de dados de saúde', marketing_email: 'E-mails informativos', browser_notifications: 'Notificações no navegador' };

async function errorMessage(response: Response) {
  const body = await response.json().catch(() => ({})) as { error?: string };
  return body.error ?? 'Ocorreu um erro. Tente novamente.';
}

export function AccountSettings({ profile, consents, preference }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [height, setHeight] = useState(profile.heightCm?.toString() ?? '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(preference?.enabled ?? false);
  const [localTime, setLocalTime] = useState(preference?.local_time?.slice(0, 5) ?? '20:00');
  const [frequency, setFrequency] = useState<ReminderFrequency>(preference?.quiet_days?.includes('0') ? 'weekdays' : 'daily');
  const [deleteStep, setDeleteStep] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const supported = permission !== 'unsupported';

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
  }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault(); setSaving('profile');
    const response = await fetch('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName, heightCm: height ? Number(height) : null }) });
    if (!response.ok) toast.error(await errorMessage(response)); else { toast.success('Perfil atualizado.'); router.refresh(); }
    setSaving(null);
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault(); setSaving('password');
    const response = await fetch('/api/account/password', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    if (!response.ok) toast.error(await errorMessage(response)); else { toast.success('Senha alterada com sucesso.'); setPassword(''); }
    setSaving(null);
  }

  async function saveReminder(nextEnabled = enabled) {
    if (nextEnabled && (!supported || Notification.permission !== 'granted')) { toast.error('Permita as notificações primeiro.'); return false; }
    setSaving('notification');
    const response = await fetch('/api/notification-preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: nextEnabled, localTime, frequency, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo' }) });
    if (!response.ok) { toast.error(await errorMessage(response)); setSaving(null); return false; }
    setEnabled(nextEnabled); toast.success(nextEnabled ? 'Lembretes ativados.' : 'Lembretes desativados.'); setSaving(null); router.refresh(); return true;
  }

  async function requestPermission() {
    if (!supported) { toast.error('Este navegador não oferece notificações locais.'); return; }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') await saveReminder(true); else toast.error('A permissão de notificações não foi concedida.');
  }

  async function deleteAccount() {
    setSaving('delete');
    const response = await fetch('/api/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation }) });
    if (!response.ok) { toast.error(await errorMessage(response)); setSaving(null); return; }
    router.replace('/entrar?conta-excluida=1'); router.refresh();
  }

  return <div className="grid gap-5 lg:grid-cols-2">
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary" /> Dados pessoais</CardTitle><CardDescription>{profile.email}</CardDescription></CardHeader><CardContent><form className="space-y-4" onSubmit={saveProfile}><div className="space-y-2"><Label htmlFor="displayName">Nome de exibição</Label><Input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} required /></div><div className="space-y-2"><Label htmlFor="height">Altura (cm)</Label><Input id="height" inputMode="decimal" type="number" min="120" max="230" step="0.1" value={height} onChange={(event) => setHeight(event.target.value)} placeholder="Ex.: 165" /></div><Button type="submit" disabled={saving === 'profile'}><Save className="size-4" />{saving === 'profile' ? 'Salvando...' : 'Salvar dados'}</Button></form></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /> Alterar senha</CardTitle><CardDescription>Use pelo menos 8 caracteres.</CardDescription></CardHeader><CardContent><form className="space-y-4" onSubmit={changePassword}><div className="space-y-2"><Label htmlFor="newPassword">Nova senha</Label><Input id="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required /></div><Button type="submit" variant="outline" disabled={saving === 'password'}>{saving === 'password' ? 'Alterando...' : 'Alterar senha'}</Button></form></CardContent></Card>
    <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2">{enabled ? <Bell className="size-5 text-primary" /> : <BellOff className="size-5 text-primary" />} Lembretes de check-in</CardTitle><CardDescription>Notificações locais funcionam enquanto esta página do Jornada Leve estiver aberta.</CardDescription></CardHeader><CardContent className="space-y-5">{permission === 'denied' && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">As notificações estão bloqueadas. Libere a permissão nas configurações do navegador.</p>}{permission === 'unsupported' && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Seu navegador não oferece suporte à Notifications API.</p>}<div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="reminderTime">Horário</Label><Input id="reminderTime" type="time" value={localTime} onChange={(event) => setLocalTime(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="frequency">Frequência</Label><select id="frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as ReminderFrequency)} className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="daily">Todos os dias</option><option value="weekdays">Segunda a sexta</option></select></div></div><div className="flex flex-wrap gap-2">{permission !== 'granted' ? <Button onClick={requestPermission} disabled={!supported || permission === 'denied'}><Bell className="size-4" /> Ativar lembretes</Button> : <><Button onClick={() => saveReminder(enabled)} disabled={saving === 'notification'}><Save className="size-4" /> Salvar configuração</Button><Button variant="outline" onClick={() => saveReminder(!enabled)} disabled={saving === 'notification'}>{enabled ? 'Desativar' : 'Ativar'} lembretes</Button></>}</div></CardContent></Card>
    <Card><CardHeader><CardTitle>Consentimentos</CardTitle><CardDescription>Registros aceitos durante o uso do Jornada Leve.</CardDescription></CardHeader><CardContent>{consents.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum consentimento encontrado.</p> : <ul className="space-y-3">{consents.map((consent) => <li key={consent.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted p-3"><div><p className="text-sm font-medium">{consentLabels[consent.consent_type] ?? consent.consent_type}</p><p className="text-xs text-muted-foreground">Versão {consent.version} · {new Intl.DateTimeFormat('pt-BR').format(new Date(consent.created_at))}</p></div><span className={cn('rounded-full px-2 py-1 text-xs font-medium', consent.granted ? 'bg-emerald-100 text-emerald-800' : 'bg-muted-foreground/10 text-muted-foreground')}>{consent.granted ? 'Aceito' : 'Recusado'}</span></li>)}</ul>}</CardContent></Card>
    <Card className="border-destructive/30"><CardHeader><CardTitle className="text-destructive">Excluir conta</CardTitle><CardDescription>Esta ação remove permanentemente seus registros e não pode ser desfeita.</CardDescription></CardHeader><CardContent>{!deleteStep ? <Button variant="destructive" onClick={() => setDeleteStep(true)}><Trash2 className="size-4" /> Excluir conta</Button> : <div className="space-y-4"><p className="text-sm">Segunda confirmação: digite <strong>EXCLUIR</strong> abaixo.</p><Input aria-label="Confirmação de exclusão" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="EXCLUIR" /><div className="flex flex-wrap gap-2"><Button variant="destructive" onClick={deleteAccount} disabled={confirmation !== 'EXCLUIR' || saving === 'delete'}>{saving === 'delete' ? 'Excluindo...' : 'Excluir permanentemente'}</Button><Button variant="outline" onClick={() => { setDeleteStep(false); setConfirmation(''); }}>Cancelar</Button></div></div>}</CardContent></Card>
  </div>;
}