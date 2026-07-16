import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar?next=/onboarding');
  const { data: profile } = await supabase.from('profiles').select('onboarding_status').eq('id', user.id).maybeSingle();
  if (profile?.onboarding_status === 'completed') redirect('/app');
  const initialName = typeof user.user_metadata.display_name === 'string' ? user.user_metadata.display_name : '';
  return <OnboardingWizard initialName={initialName} />;
}