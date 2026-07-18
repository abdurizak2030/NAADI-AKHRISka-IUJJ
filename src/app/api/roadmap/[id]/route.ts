import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { deleteRoadmapNode, updateRoadmapNode } from '@/lib/server/repositories/content.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await safeJsonBody(request);
    const node = await updateRoadmapNode(id, body);
    if (!node) return NextResponse.json({ error: 'Roadmap node lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'UPDATE_ROADMAP_NODE', `La cusboonaysiiyey tallaabada: ${node.title}`);
    return NextResponse.json(node);
  } catch (err) {
    return handleError(err, 'PUT /api/roadmap/[id]');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const node = await deleteRoadmapNode(id);
    if (!node) return NextResponse.json({ error: 'Roadmap node lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'DELETE_ROADMAP_NODE', `La tirtiray tallaabada: ${node.title}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/roadmap/[id]');
  }
}
