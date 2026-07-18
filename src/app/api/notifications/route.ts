import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin, requireAuth } from '@/lib/server/auth';
import { createNotification, listNotificationsForUser } from '@/lib/server/repositories/content.repository';

export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await listNotificationsForUser(auth.payload.userId));
  } catch (err) {
    return handleError(err, 'GET /api/notifications');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { title, message, userId } = await safeJsonBody(request);
    if (!title || !message) {
      return NextResponse.json({ error: 'Buuxi cinwaanka iyo fariinta.' }, { status: 400 });
    }
    const notification = await createNotification({ title, message, userId });
    return NextResponse.json(notification, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/notifications');
  }
}
