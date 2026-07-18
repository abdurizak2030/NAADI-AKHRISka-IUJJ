import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { listContactMessages } from '@/lib/server/repositories/content.repository';

export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await listContactMessages());
  } catch (err) {
    return handleError(err, 'GET /api/admin/messages');
  }
}
