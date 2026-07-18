import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { getSettings, updateSettings } from '@/lib/server/repositories/content.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET() {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    return NextResponse.json(await getSettings());
  } catch (err) {
    return handleError(err, 'GET /api/settings');
  }
}

export async function PUT(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await safeJsonBody(request);
    const settings = await updateSettings(body);
    addAuditLog(auth.payload.userId, auth.payload.name, 'UPDATE_SETTINGS', 'Dejinta website-ka ayaa la cusboonaysiiyey.');
    return NextResponse.json(settings);
  } catch (err) {
    return handleError(err, 'PUT /api/settings');
  }
}
