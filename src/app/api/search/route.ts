import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { searchEverything } from '@/lib/server/repositories/search.repository';

export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const q = request.nextUrl.searchParams.get('q') ?? '';
    const perType = Number(request.nextUrl.searchParams.get('limit') ?? 6);
    const results = await searchEverything(q.slice(0, 100), Number.isFinite(perType) ? perType : 6);
    return NextResponse.json(results, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } });
  } catch (err) {
    return handleError(err, 'GET /api/search');
  }
}
