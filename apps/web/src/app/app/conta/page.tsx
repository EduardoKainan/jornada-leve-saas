import { AccountSettings } from '@/components/account/account-settings';
import { createClient } from '@/lib/supabase/server';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: consents }, { data: preference }] = await Promise.all([
    supabase.from('profiles').select('display_name, height_cm').eq('id', user!.id).single(),
    supabase.from('consent_records').select('id, consent_type, version, granted, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('notification_preferences').select('enabled, local_time, quiet_days, timezone').eq('user_id', user!.id).eq('channel', 'browser').eq('type', 'daily_checkin').maybeSingle(),
  ]);
  return <div className="space-y-6"><header><p className="text-sm text-muted-foreground">Preferências e privacidade</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sua conta</h1></header><AccountSettings profile={{ displayName: profile?.display_name ?? '', heightCm: profile?.height_cm ? Number(profile.height_cm) : null, email: user?.email ?? '' }} consents={consents ?? []} preference={preference} /></div>;
}