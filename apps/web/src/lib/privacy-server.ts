import { sendEmail } from '@jornada-leve/email';
import { createSignedToken, privacySecret } from '@/lib/privacy';
import { createAdminClient } from '@/lib/supabase/admin';

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://jornadaleve.com.br').replace(/\/$/, '');

export function unsubscribeUrl(userId: string, email: string): string {
  const token = createSignedToken({ purpose: 'unsubscribe', userId, email }, privacySecret(), new Date(), 365 * 24 * 60 * 60);
  return `${appUrl()}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

async function removeUserFolder(bucket: string, userId: string, prefix = userId): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) {
    if (/not found|does not exist/i.test(error.message)) return;
    throw error;
  }
  const files = (data ?? []).filter((item) => item.id).map((item) => `${prefix}/${item.name}`);
  if (files.length) {
    const { error: removeError } = await admin.storage.from(bucket).remove(files);
    if (removeError) throw removeError;
  }
  for (const folder of (data ?? []).filter((item) => !item.id)) await removeUserFolder(bucket, userId, `${prefix}/${folder.name}`);
}

export async function processAccountDeletion(requestId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: request } = await admin.from('privacy_requests')
    .select('id, user_id, status')
    .eq('id', requestId)
    .eq('request_type', 'deletion')
    .in('status', ['confirmed', 'processing'])
    .maybeSingle();
  if (!request) return false;
  await admin.from('privacy_requests').update({ status: 'processing' }).eq('id', request.id);
  const { data: authData, error: authReadError } = await admin.auth.admin.getUserById(request.user_id);
  if (authReadError || !authData.user?.email) {
    await admin.from('privacy_requests').update({ status: 'failed' }).eq('id', request.id);
    return false;
  }
  const email = authData.user.email;
  try {
    for (const bucket of ['photos', 'reports', 'privacy-exports']) await removeUserFolder(bucket, request.user_id);
    const { error: profileError } = await admin.from('profiles').delete().eq('id', request.user_id);
    if (profileError) throw profileError;
    const { error: authError } = await admin.auth.admin.deleteUser(request.user_id);
    if (authError) throw authError;
    if (process.env.RESEND_API_KEY) {
      await sendEmail({
        to: email,
        template: 'account-deletion-completed',
        props: { actionUrl: appUrl(), unsubscribeUrl: `${appUrl()}/privacidade` },
      });
    }
    return true;
  } catch (error) {
    await admin.from('privacy_requests').update({ status: 'failed' }).eq('id', request.id);
    throw error;
  }
}
