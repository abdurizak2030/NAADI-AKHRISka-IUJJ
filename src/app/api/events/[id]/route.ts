import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { deleteEvent, updateEvent } from '@/lib/server/repositories/events.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await safeJsonBody(request);
    const event = await updateEvent(id, body);
    if (!event) return NextResponse.json({ error: 'Kulanka lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'EDIT_EVENT', `La cusboonaysiiyey kulan: ${event.title}`);
    return NextResponse.json(event);
  } catch (err) {
    return handleError(err, 'PUT /api/events/[id]');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const event = await deleteEvent(id);
    if (!event) return NextResponse.json({ error: 'Kulanka lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'DELETE_EVENT', `La tirtiray kulankii: ${event.title}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/events/[id]');
  }
}
