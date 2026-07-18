import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { adminUpdateUser, deleteUser, findUserById } from '@/lib/server/repositories/user.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const { name, email, role, studentId, department, title } = await safeJsonBody(request);
    if (role && role !== 'ADMIN' && role !== 'MEMBER') {
      return NextResponse.json({ error: 'Doorka waa inuu ahaadaa ADMIN ama MEMBER.' }, { status: 400 });
    }

    const user = await adminUpdateUser(id, { name, email, role, studentId, department, title });
    if (!user) return NextResponse.json({ error: 'Isticmaalaha lama helin.' }, { status: 404 });

    addAuditLog(auth.payload.userId, auth.payload.name, 'EDIT_USER', `La cusboonaysiiyey akoonka: ${user.email}`);
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof Error && err.name === 'EmailTakenError') {
      return NextResponse.json({ error: 'Iimaylkan mar hore ayaa loo isticmaalay.' }, { status: 409 });
    }
    return handleError(err, 'PUT /api/admin/users/[id]');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    if (id === auth.payload.userId) {
      return NextResponse.json({ error: 'Ma tirtiri kartid akoonkaaga hadda aad ku jirto.' }, { status: 400 });
    }

    const existing = await findUserById(id);
    if (!existing) return NextResponse.json({ error: 'Isticmaalaha lama helin.' }, { status: 404 });

    await deleteUser(id);
    addAuditLog(auth.payload.userId, auth.payload.name, 'DELETE_USER', `La tirtiray akoonka: ${existing.email}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/admin/users/[id]');
  }
}
