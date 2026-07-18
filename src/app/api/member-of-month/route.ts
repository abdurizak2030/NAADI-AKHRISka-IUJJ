import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { getMemberOfMonth, updateMemberOfMonth } from '@/lib/server/repositories/content.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET() {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    return NextResponse.json(await getMemberOfMonth());
  } catch (err) {
    return handleError(err, 'GET /api/member-of-month');
  }
}

export async function PUT(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;

  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await safeJsonBody(request);
    const mom = await updateMemberOfMonth(body);
    addAuditLog(auth.payload.userId, auth.payload.name, 'UPDATE_MEMBER_OF_MONTH', 'Xubinta bishu la cusboonaysiiyey.');
    return NextResponse.json(mom);
  } catch (err) {
    return handleError(err, 'PUT /api/member-of-month');
  }
}
