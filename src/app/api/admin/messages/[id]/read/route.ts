import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { markContactMessageRead } from '@/lib/server/repositories/content.repository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await safeJsonBody(request);
    const isRead = body.isRead !== false;
    const msg = await markContactMessageRead(id, isRead);
    if (!msg) return NextResponse.json({ error: 'Fariinta lama helin.' }, { status: 404 });
    return NextResponse.json(msg);
  } catch (err) {
    return handleError(err, 'PUT /api/admin/messages/[id]/read');
  }
}
