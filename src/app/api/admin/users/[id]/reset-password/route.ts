import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { adminResetPassword } from '@/lib/server/repositories/user.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const { newPassword } = await safeJsonBody(request);
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'Erayga sirta ah cusub waa inuu ka kooban yahay ugu yaraan 6 xaraf.' }, { status: 400 });
    }

    const user = await adminResetPassword(id, newPassword);
    if (!user) return NextResponse.json({ error: 'Isticmaalaha lama helin.' }, { status: 404 });

    addAuditLog(auth.payload.userId, auth.payload.name, 'RESET_PASSWORD', `La beddelay ereysirta: ${user.email}`);
    return NextResponse.json({ success: true, user });
  } catch (err) {
    return handleError(err, 'POST /api/admin/users/[id]/reset-password');
  }
}
