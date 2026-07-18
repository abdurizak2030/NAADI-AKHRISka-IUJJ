import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { setUserActive } from '@/lib/server/repositories/user.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await safeJsonBody(request);
    const isActive = body?.isActive === true;

    if (!isActive && id === auth.payload.userId) {
      return NextResponse.json({ error: 'Ma tirtiri kartid / joojin kartid akoonkaaga hadda aad ku jirto.' }, { status: 400 });
    }

    const user = await setUserActive(id, isActive);
    if (!user) return NextResponse.json({ error: 'Isticmaalaha lama helin.' }, { status: 404 });

    addAuditLog(
      auth.payload.userId,
      auth.payload.name,
      isActive ? 'ENABLE_USER' : 'DISABLE_USER',
      `${isActive ? 'La dajiyey' : 'La joojiyey'} akoonka: ${user.email}`
    );
    return NextResponse.json(user);
  } catch (err) {
    return handleError(err, 'PUT /api/admin/users/[id]/disable');
  }
}
