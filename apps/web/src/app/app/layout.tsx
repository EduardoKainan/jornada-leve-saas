import { redirect } from 'next/navigation';
import { AppNav } from '@/components/app/app-nav';
import { ReminderScheduler } from '@/components/app/reminder-scheduler';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar?next=/app');
  const [{ data: profile }, { data: reminder }] = await Promise.all([
    supabase.from('profiles').select('display_name, onboarding_status').eq('id', user.id).maybeSingle(),
    supabase.from('notification_preferences').select('enabled, local_time, quiet_days').eq('user_id', user.id).eq('channel', 'browser').eq('type', 'daily_checkin').maybeSingle(),
  ]);
  if (!profile || profile.onboarding_status !== 'completed') redirect('/onboarding');
  return <div className="min-h-dvh bg-muted/30"><ReminderScheduler enabled={reminder?.enabled ?? false} localTime={reminder?.local_time?.slice(0, 5) ?? '20:00'} frequency={reminder?.quiet_days?.includes('0') ? 'weekdays' : 'daily'} /><AppNav name={profile.display_name} /><main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:ml-64 md:px-8 md:py-8">{children}</main></div>;
}