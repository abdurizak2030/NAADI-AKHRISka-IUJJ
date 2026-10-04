import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { deleteSubscriber } from '@/lib/server/repositories/subscribers.repository';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const ok = await deleteSubscriber(id);
    if (!ok) return NextResponse.json({ error: 'Subscriber not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/admin/subscribers/[id]');
  }
}
