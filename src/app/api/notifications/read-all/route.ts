import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { requireAuth } from '@/lib/server/auth';
import { markAllNotificationsRead } from '@/lib/server/repositories/content.repository';

export async function PUT(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  try {
    await markAllNotificationsRead(auth.payload.userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'PUT /api/notifications/read-all');
  }
}
