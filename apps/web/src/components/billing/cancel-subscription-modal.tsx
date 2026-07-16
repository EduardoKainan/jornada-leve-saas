'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CancelSubscriptionModal({ open, loading, onClose, onConfirm }: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmation, setConfirmation] = useState('');
  if (!open) return null;
  function close() { setStep(1); setConfirmation(''); onClose(); }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
    <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4"><div><h2 id="cancel-title" className="text-xl font-semibold">Cancelar assinatura</h2><p className="mt-1 text-sm text-muted-foreground">Etapa {step} de 2</p></div><button aria-label="Fechar" onClick={close}><X className="size-5" /></button></div>
      {step === 1 ? <div className="mt-5 space-y-4"><p className="text-sm leading-6">Você perderá o acesso aos recursos pagos. Tem certeza de que deseja continuar?</p><div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={close}>Manter plano</Button><Button variant="destructive" className="flex-1" onClick={() => setStep(2)}>Continuar</Button></div></div> : <div className="mt-5 space-y-4"><div><Label htmlFor="cancel-confirmation">Digite <strong>CANCELAR</strong> para confirmar</Label><Input id="cancel-confirmation" className="mt-2" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></div><div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button><Button variant="destructive" className="flex-1" disabled={confirmation !== 'CANCELAR' || loading} onClick={onConfirm}>{loading ? 'Cancelando…' : 'Cancelar'}</Button></div></div>}
    </div>
  </div>;
}
