import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { deleteVideo, updateVideo } from '@/lib/server/repositories/media.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await safeJsonBody(request);
    const video = await updateVideo(id, body);
    if (!video) return NextResponse.json({ error: 'Muuqaalka lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'EDIT_VIDEO', `La cusboonaysiiyey muuqaal: ${video.title}`);
    return NextResponse.json(video);
  } catch (err) {
    return handleError(err, 'PUT /api/videos/[id]');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const video = await deleteVideo(id);
    if (!video) return NextResponse.json({ error: 'Muuqaalka lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'DELETE_VIDEO', `La tirtiray muuqaalka: ${video.title}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/videos/[id]');
  }
}
