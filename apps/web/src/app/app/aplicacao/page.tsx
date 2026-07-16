'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, CheckCircle2, Clock3, History, LoaderCircle, Syringe } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  APPLICATION_SYMPTOMS,
  buildApplicationSummary,
  MOUNJARO_DOSES,
  type ApplicationDetails,
} from '@/lib/mounjaro';
import { cn } from '@/lib/utils';

type Application = ApplicationDetails & {
  id: string;
  applicationDate: string;
  status: string;
  completedAt: string | null;
};

type FormState = {
  applicationDate: string;
  dose: ApplicationDetails['dose'];
  location: ApplicationDetails['location'];
  symptoms: ApplicationDetails['symptoms'];
  notes: string;
};

const locationLabels: Record<ApplicationDetails['location'], string> = {
  abdomen: 'Abdômen',
  coxa: 'Coxa',
  braco: 'Braço',
};

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function initialForm(): FormState {
  return {
    applicationDate: localDate(),
    dose: '2.5',
    location: 'abdomen',
    symptoms: [],
    notes: '',
  };
}

function formatApplicationDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(value),
  );
}

function LoadingSkeleton() {
  return (
    <div aria-label="Carregando aplicações" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-muted h-28 animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="bg-muted h-56 animate-pulse rounded-2xl" />
    </div>
  );
}

export default function ApplicationPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/aplicacoes');
      const body = (await response.json()) as { applications?: Application[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Não foi possível carregar as aplicações.');
      setApplications(body.applications ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Não foi possível carregar as aplicações.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const summary = useMemo(
    () => buildApplicationSummary(applications.map((application) => application.applicationDate)),
    [applications],
  );

  function toggleSymptom(symptom: ApplicationDetails['symptoms'][number]) {
    setForm((current) => {
      if (symptom === 'Nenhum') {
        return { ...current, symptoms: current.symptoms.includes('Nenhum') ? [] : ['Nenhum'] };
      }
      const withoutNone = current.symptoms.filter((item) => item !== 'Nenhum');
      return {
        ...current,
        symptoms: withoutNone.includes(symptom)
          ? withoutNone.filter((item) => item !== symptom)
          : [...withoutNone, symptom],
      };
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/aplicacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Não foi possível registrar a aplicação.');
      toast.success('Aplicação registrada com sucesso.');
      setForm(initialForm());
      await loadApplications();
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível registrar a aplicação.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      <header>
        <p className="text-sm font-semibold text-emerald-700">Seu tratamento em dia</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Controle de Aplicação
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Registre suas aplicações de Mounjaro
        </p>
      </header>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div role="alert" className="border-destructive/30 bg-destructive/5 rounded-2xl border p-5">
          <p className="text-destructive font-medium">Não foi possível carregar seus registros.</p>
          <p className="text-muted-foreground mt-1 text-sm">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void loadApplications()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <section aria-label="Resumo das aplicações" className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Clock3 className="size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Última aplicação</p>
                  <p className="mt-1 font-semibold">
                    {summary.daysSinceLast === null
                      ? 'Sem registro'
                      : `Há ${summary.daysSinceLast} ${summary.daysSinceLast === 1 ? 'dia' : 'dias'}`}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Próxima aplicação prevista</p>
                  <p className="mt-1 font-semibold">
                    {summary.nextApplicationDate
                      ? formatApplicationDate(`${summary.nextApplicationDate}T12:00:00Z`)
                      : 'A definir'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Syringe className="size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total registrado</p>
                  <p className="mt-1 font-semibold">
                    {summary.total} {summary.total === 1 ? 'aplicação' : 'aplicações'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Registrar aplicação</CardTitle>
                <CardDescription>Preencha os dados da aplicação realizada.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="application-date">Data da aplicação</Label>
                      <Input
                        id="application-date"
                        type="date"
                        max={localDate()}
                        value={form.applicationDate}
                        onChange={(event) =>
                          setForm({ ...form, applicationDate: event.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dose">Dose</Label>
                      <select
                        id="dose"
                        value={form.dose}
                        onChange={(event) =>
                          setForm({ ...form, dose: event.target.value as FormState['dose'] })
                        }
                        className="bg-background focus:ring-ring h-11 w-full rounded-xl border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                      >
                        {MOUNJARO_DOSES.map((dose) => (
                          <option key={dose} value={dose}>
                            {dose}mg
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Local da aplicação</Label>
                    <select
                      id="location"
                      value={form.location}
                      onChange={(event) =>
                        setForm({ ...form, location: event.target.value as FormState['location'] })
                      }
                      className="bg-background focus:ring-ring h-11 w-full rounded-xl border px-3 text-base outline-none focus:ring-2 sm:text-sm"
                    >
                      {Object.entries(locationLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium">Sintomas/efeitos</legend>
                    <div className="flex flex-wrap gap-2">
                      {APPLICATION_SYMPTOMS.map((symptom) => {
                        const selected = form.symptoms.includes(symptom);
                        return (
                          <button
                            key={symptom}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleSymptom(symptom)}
                            className={cn(
                              'rounded-full border px-3 py-2 text-sm transition-colors',
                              selected
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                : 'bg-background hover:bg-accent',
                            )}
                          >
                            {symptom}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                  <div className="space-y-2">
                    <div className="flex justify-between gap-3">
                      <Label htmlFor="notes">Observações (opcional)</Label>
                      <span className="text-muted-foreground text-xs">
                        {form.notes.length}/1000
                      </span>
                    </div>
                    <textarea
                      id="notes"
                      rows={4}
                      maxLength={1000}
                      value={form.notes}
                      onChange={(event) => setForm({ ...form, notes: event.target.value })}
                      placeholder="Anote como foi a aplicação ou algo que queira lembrar"
                      className="bg-background placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 sm:text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Registrando…
                      </>
                    ) : (
                      <>
                        <Syringe className="size-4" />
                        Registrar aplicação
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <section aria-labelledby="application-history-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="application-history-title" className="text-xl font-semibold">
                  Histórico de aplicações
                </h2>
                <Link
                  href="/app/calendario"
                  className="shrink-0 text-sm font-medium text-emerald-700 hover:underline"
                >
                  Ver todas
                </Link>
              </div>
              {applications.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="grid min-h-48 place-items-center p-6 text-center">
                    <div>
                      <History className="mx-auto mb-3 size-8 text-emerald-600" />
                      <p className="font-medium">Nenhuma aplicação registrada ainda</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Seu histórico aparecerá aqui após o primeiro registro.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 5).map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {formatApplicationDate(application.applicationDate)}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                              {application.dose}mg · {locationLabels[application.location]}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="size-3.5" />
                            {application.status === 'completed' ? 'Realizada' : application.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
