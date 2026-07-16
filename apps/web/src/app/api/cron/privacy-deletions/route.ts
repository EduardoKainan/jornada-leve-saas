import { NextResponse, type NextRequest } from 'next/server';
import { processAccountDeletion } from '@/lib/privacy-server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: 'Job de exclusão não configurado.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const admin = createAdminClient();
  const { data: requests, error } = await admin.from('privacy_requests')
    .select('id')
    .eq('request_type', 'deletion')
    .in('status', ['confirmed', 'processing'])
    .order('requested_at', { ascending: true })
    .limit(20);
  if (error) return NextResponse.json({ error: 'Não foi possível consultar a fila.' }, { status: 500 });
  let completed = 0;
  let failed = 0;
  for (const item of requests ?? []) {
    try {
      if (await processAccountDeletion(item.id)) completed += 1;
    } catch {
      failed += 1;
    }
  }
  return NextResponse.json({ checked: requests?.length ?? 0, completed, failed });
}
