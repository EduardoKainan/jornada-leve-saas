'use client';

import { useState } from 'react';
import { Check, Download, LoaderCircle, Share2 } from 'lucide-react';

type ShareEvolutionActionsProps = {
  showSave?: boolean;
  compact?: boolean;
};

const cardEndpoint = '/api/compartilhar/card';

async function getCardFile(): Promise<File> {
  const response = await fetch(cardEndpoint, { cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível gerar a imagem agora.');
  const blob = await response.blob();
  return new File([blob], 'minha-evolucao-jornada-leve.png', { type: 'image/png' });
}

export function ShareEvolutionActions({ showSave = false, compact = false }: ShareEvolutionActionsProps) {
  const [busyAction, setBusyAction] = useState<'share' | 'save' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function shareCard() {
    setBusyAction('share');
    setFeedback(null);
    try {
      const file = await getCardFile();
      const shareUrl = `${window.location.origin}/app/compartilhar`;
      const shareData: ShareData = {
        title: 'Minha evolução na Jornada Leve',
        text: 'Estou acompanhando minha evolução com a Jornada Leve.',
        files: [file],
      };

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setFeedback('Card compartilhado!');
      } else if (navigator.share) {
        await navigator.share({ title: shareData.title, text: shareData.text, url: shareUrl });
        setFeedback('Compartilhamento aberto!');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setFeedback('Link copiado!');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setFeedback(error instanceof Error ? error.message : 'Não foi possível compartilhar agora.');
    } finally {
      setBusyAction(null);
    }
  }

  async function saveCard() {
    setBusyAction('save');
    setFeedback(null);
    try {
      const file = await getCardFile();
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setFeedback('Imagem salva!');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar agora.');
    } finally {
      setBusyAction(null);
    }
  }

  const buttonClass = compact
    ? 'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-background px-4 font-medium text-primary hover:bg-primary/5'
    : 'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto';

  return <div className={compact ? 'flex flex-col items-stretch gap-2 sm:items-end' : 'space-y-3'}>
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={shareCard} disabled={busyAction !== null} className={buttonClass}>
        {busyAction === 'share' ? <LoaderCircle className="size-5 animate-spin" /> : <Share2 className="size-5" />}
        {compact ? 'Compartilhar' : 'Compartilhar agora'}
      </button>
      {showSave && <button type="button" onClick={saveCard} disabled={busyAction !== null} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 font-semibold hover:bg-muted sm:w-auto">
        {busyAction === 'save' ? <LoaderCircle className="size-5 animate-spin" /> : <Download className="size-5" />}
        Salvar imagem
      </button>}
    </div>
    {feedback && <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground"><Check className="size-4 text-primary" />{feedback}</p>}
  </div>;
}
