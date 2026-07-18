import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { deleteGalleryItem } from '@/lib/server/repositories/media.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const item = await deleteGalleryItem(id);
    if (!item) return NextResponse.json({ error: 'Sawirka lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'DELETE_GALLERY_ITEM', `La tirtiray sawir: ${item.title}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/gallery/[id]');
  }
}
