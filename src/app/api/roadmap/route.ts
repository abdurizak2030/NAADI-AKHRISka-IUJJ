import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { createRoadmapNode, listRoadmap } from '@/lib/server/repositories/content.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET() {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    return NextResponse.json(await listRoadmap());
  } catch (err) {
    return handleError(err, 'GET /api/roadmap');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await safeJsonBody(request);
    const { title, step } = body;
    if (!title || step === undefined || step === null) {
      return NextResponse.json({ error: 'Buuxi cinwaanka iyo taliska (step).' }, { status: 400 });
    }
    const node = await createRoadmapNode(body);
    addAuditLog(auth.payload.userId, auth.payload.name, 'CREATE_ROADMAP_NODE', `Tallaabo cusub oo jidka waxbarasho ah: ${node.title}`);
    return NextResponse.json(node, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/roadmap');
  }
}
