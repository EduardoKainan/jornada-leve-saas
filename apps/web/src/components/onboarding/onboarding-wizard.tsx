'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Leaf, LoaderCircle, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ONBOARDING_STORAGE_KEY, type OnboardingDraft, onboardingSchema } from '@/lib/onboarding';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 6;
const frequencyOptions = [
  ['daily', 'Todos os dias', 'Para quem gosta de acompanhar variações diárias'],
  ['weekly', 'Uma vez por semana', 'Recomendado para uma visão equilibrada'],
  ['biweekly', 'A cada 15 dias', 'Menos foco nos números'],
  ['monthly', 'Uma vez por mês', 'Acompanhamento de longo prazo'],
] as const;

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>({ displayName: initialName, timezone: 'America/Sao_Paulo', emailOptIn: false, weighingFrequency: 'weekly' });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { step?: number; draft?: OnboardingDraft };
        setDraft((current) => ({ ...current, ...parsed.draft }));
        setStep(Math.min(TOTAL_STEPS, Math.max(1, parsed.step ?? 1)));
      }
    } catch { localStorage.removeItem(ONBOARDING_STORAGE_KEY); }
  }, []);

  useEffect(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ step, draft }));
  }, [step, draft]);

  function update<K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function stepIsValid() {
    if (step === 1) return draft.adultConfirmed === true;
    if (step === 2) return Boolean(draft.displayName?.trim() && draft.timezone);
    if (step === 3) return Number(draft.initialWeightKg) >= 30 && Number(draft.targetWeightKg) >= 30;
    if (step === 4) return !draft.heightCm || (Number(draft.heightCm) >= 100 && Number(draft.heightCm) <= 250);
    if (step === 5) return draft.termsAccepted === true && draft.privacyAccepted === true && draft.sensitiveDataAccepted === true;
    return Boolean(draft.weighingFrequency);
  }

  async function advance(event: FormEvent) {
    event.preventDefault();
    if (!stepIsValid()) return toast.error('Revise os campos obrigatórios para continuar.');
    if (step < TOTAL_STEPS) return setStep((current) => current + 1);
    const parsed = onboardingSchema.safeParse(draft);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? 'Revise seus dados.');
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(parsed.data) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível concluir.');
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      router.replace('/app?boas-vindas=1'); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Tente novamente.'); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between"><div className="flex items-center gap-2 font-semibold"><Leaf className="size-6 text-primary" /> Jornada Leve</div><div className="flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" /> Salvo neste dispositivo</div></div>
        <div className="mb-8"><div className="mb-2 flex justify-between text-sm"><span>Etapa {step} de {TOTAL_STEPS}</span><span className="text-muted-foreground">{Math.round(step / TOTAL_STEPS * 100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${step / TOTAL_STEPS * 100}%` }} /></div></div>
        <form onSubmit={advance} className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
          {step === 1 && <Step title="Bem-vindo à sua jornada" description="Antes de começar, precisamos confirmar uma informação importante."><label className="mt-6 flex cursor-pointer gap-3 rounded-2xl border p-4 hover:bg-accent"><input type="checkbox" className="mt-1 size-4 accent-primary" checked={draft.adultConfirmed ?? false} onChange={(e) => update('adultConfirmed', e.target.checked || undefined)} /><span><strong className="block">Tenho 18 anos ou mais</strong><span className="mt-1 block text-sm text-muted-foreground">O Jornada Leve é destinado exclusivamente a pessoas adultas.</span></span></label><p className="mt-4 text-xs text-muted-foreground">Este aplicativo apoia a organização da sua rotina e não substitui acompanhamento médico.</p></Step>}
          {step === 2 && <Step title="Como podemos personalizar sua experiência?" description="Usaremos seu primeiro nome nas mensagens e o fuso para organizar seus registros."><Field label="Seu nome" htmlFor="displayName"><Input id="displayName" autoFocus value={draft.displayName ?? ''} onChange={(e) => update('displayName', e.target.value)} placeholder="Ex.: Maria" /></Field><Field label="Fuso horário" htmlFor="timezone"><select id="timezone" className="h-11 w-full rounded-xl border bg-background px-3" value={draft.timezone} onChange={(e) => update('timezone', e.target.value)}><option value="America/Sao_Paulo">Brasília (GMT-3)</option><option value="America/Manaus">Manaus (GMT-4)</option><option value="America/Rio_Branco">Rio Branco (GMT-5)</option><option value="America/Noronha">Fernando de Noronha (GMT-2)</option></select></Field></Step>}
          {step === 3 && <Step title="Defina seu ponto de partida" description="Esses dados ajudam a mostrar sua evolução. Você poderá alterá-los depois."><div className="grid gap-5 sm:grid-cols-2"><Field label="Peso atual (kg)" htmlFor="initialWeight"><Input id="initialWeight" type="number" inputMode="decimal" min="30" max="350" step="0.1" value={draft.initialWeightKg ?? ''} onChange={(e) => update('initialWeightKg', e.target.valueAsNumber)} placeholder="Ex.: 82,4" /></Field><Field label="Meta de peso (kg)" htmlFor="targetWeight"><Input id="targetWeight" type="number" inputMode="decimal" min="30" max="350" step="0.1" value={draft.targetWeightKg ?? ''} onChange={(e) => update('targetWeightKg', e.target.valueAsNumber)} placeholder="Ex.: 70" /></Field></div><p className="mt-5 rounded-xl bg-muted p-3 text-xs text-muted-foreground">Escolha metas realistas com apoio de um profissional de saúde.</p></Step>}
          {step === 4 && <Step title="Qual é a sua altura?" description="Opcional — ela pode ajudar a contextualizar sua evolução."><Field label="Altura (cm) — opcional" htmlFor="height"><Input id="height" type="number" inputMode="decimal" min="100" max="250" step="0.1" value={draft.heightCm ?? ''} onChange={(e) => update('heightCm', e.target.value ? e.target.valueAsNumber : undefined)} placeholder="Ex.: 165" /></Field><button type="button" onClick={() => { update('heightCm', undefined); setStep(5); }} className="mt-4 text-sm text-primary hover:underline">Prefiro não informar</button></Step>}
          {step === 5 && <Step title="Você controla seus dados" description="Jornada Leve Tecnologia Ltda. usa seus dados para operar o diário, exibir sua evolução e enviar comunicações escolhidas por você."><Consent checked={draft.termsAccepted} onChange={(v) => update('termsAccepted', v || undefined)} required title="Termos de uso" detail="Regras para uso seguro do serviço • versão 2026-07-01" /><Consent checked={draft.privacyAccepted} onChange={(v) => update('privacyAccepted', v || undefined)} required title="Política de privacidade" detail="Como coletamos, protegemos e permitimos excluir seus dados • versão 2026-07-01" /><Consent checked={draft.sensitiveDataAccepted} onChange={(v) => update('sensitiveDataAccepted', v || undefined)} required title="Tratamento de dados de saúde" detail="Peso, medidas e registros são usados somente para oferecer as funcionalidades solicitadas." /><Consent checked={draft.emailOptIn} onChange={(v) => update('emailOptIn', v)} title="Lembretes e novidades por e-mail" detail="Opcional • até 2 mensagens por semana • cancele quando quiser na sua conta." /><p className="mt-4 text-xs text-muted-foreground">Consentimentos obrigatórios e opcionais são registrados separadamente, com data, origem e versão.</p></Step>}
          {step === 6 && <Step title="Com que frequência você quer se pesar?" description="Vamos adaptar seus próximos lembretes. Você poderá mudar isso a qualquer momento."><div className="space-y-3">{frequencyOptions.map(([value, title, description]) => <label key={value} className={cn('flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors', draft.weighingFrequency === value && 'border-primary bg-primary/5')}><input type="radio" name="frequency" className="mt-1 accent-primary" checked={draft.weighingFrequency === value} onChange={() => update('weighingFrequency', value)} /><span><strong className="block text-sm">{title}</strong><span className="text-xs text-muted-foreground">{description}</span></span>{draft.weighingFrequency === value && <Check className="ml-auto size-5 text-primary" />}</label>)}</div></Step>}
          <div className="mt-8 flex items-center justify-between gap-3">{step > 1 ? <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}><ArrowLeft className="size-4" /> Voltar</Button> : <span />}<Button type="submit" disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : step === TOTAL_STEPS ? <Check className="size-4" /> : <ArrowRight className="size-4" />}{step === TOTAL_STEPS ? 'Concluir' : 'Continuar'}</Button></div>
        </form>
      </div>
    </main>
  );
}

function Step({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 mb-6 text-sm text-muted-foreground sm:text-base">{description}</p><div className="space-y-5">{children}</div></section>; }
function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>; }
function Consent({ checked, onChange, required, title, detail }: { checked?: boolean; onChange: (value: boolean) => void; required?: boolean; title: string; detail: string }) { return <label className="flex cursor-pointer gap-3 rounded-xl border p-3"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-primary" checked={checked ?? false} onChange={(e) => onChange(e.target.checked)} /><span><strong className="block text-sm">{title} {required ? <span className="text-destructive">*</span> : <span className="font-normal text-muted-foreground">(opcional)</span>}</strong><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{detail}</span></span></label>; }