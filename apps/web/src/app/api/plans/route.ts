import { NextResponse } from 'next/server';
import { PLANS } from '@/lib/sprint4';

export async function GET() {
  return NextResponse.json({ plans: PLANS }, {
    headers: { 'cache-control': 'public, max-age=300, stale-while-revalidate=3600' },
  });
}
