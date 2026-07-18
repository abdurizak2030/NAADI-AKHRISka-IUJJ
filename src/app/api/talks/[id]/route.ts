import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { deleteTalk, updateTalk } from '@/lib/server/repositories/media.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await safeJsonBody(request);
    const talk = await updateTalk(id, body);
    if (!talk) return NextResponse.json({ error: 'Falanqaynta lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'EDIT_TALK', `La cusboonaysiiyey falanqayn: ${talk.title}`);
    return NextResponse.json(talk);
  } catch (err) {
    return handleError(err, 'PUT /api/talks/[id]');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const talk = await deleteTalk(id);
    if (!talk) return NextResponse.json({ error: 'Falanqaynta lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'DELETE_TALK', `La tirtiray falanqayntii: ${talk.title}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/talks/[id]');
  }
}
