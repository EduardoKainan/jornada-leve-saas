import type { Metadata } from 'next';
import { PrivacyActions } from '@/components/privacy/privacy-actions';

export const metadata: Metadata = { title: 'Privacidade', robots: { index: false, follow: false } };

export default function PrivacyPage() {
  return <div className="space-y-6"><header><p className="text-sm text-muted-foreground">LGPD e segurança</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Privacidade</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Gerencie uma cópia dos seus dados ou solicite a exclusão segura da sua conta.</p></header><PrivacyActions /></div>;
}
