import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { getRoadmapProgress, updateRoadmapProgress } from '@/lib/server/repositories/content.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET() {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    return NextResponse.json(await getRoadmapProgress());
  } catch (err) {
    return handleError(err, 'GET /api/roadmap/progress');
  }
}

export async function PUT(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await safeJsonBody(request);
    const startDate = typeof body.startDate === 'string' ? body.startDate : undefined;
    const endDate = typeof body.endDate === 'string' ? body.endDate : undefined;
    const progress = await updateRoadmapProgress({ startDate, endDate });
    addAuditLog(auth.payload.userId, auth.payload.name, 'UPDATE_ROADMAP_PROGRESS', 'Academy roadmap progress dates were updated.');
    return NextResponse.json(progress);
  } catch (err) {
    return handleError(err, 'PUT /api/roadmap/progress');
  }
}