import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { deleteContactMessage } from '@/lib/server/repositories/content.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const msg = await deleteContactMessage(id);
    if (!msg) return NextResponse.json({ error: 'Fariinta lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'DELETE_CONTACT_MESSAGE', `La tirtiray fariin ka timid: ${msg.email}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/admin/messages/[id]');
  }
}
