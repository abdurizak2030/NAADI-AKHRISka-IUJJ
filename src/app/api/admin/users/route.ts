import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { adminCreateUser, listUsers } from '@/lib/server/repositories/user.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await listUsers());
  } catch (err) {
    return handleError(err, 'GET /api/admin/users');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await safeJsonBody(request);
    const { name, email, password, role, studentId, department } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Fadlan buuxi magaca, iimaylka, iyo erayga sirta ah.' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Erayga sirta ah waa inuu ka kooban yahay ugu yaraan 6 xaraf.' }, { status: 400 });
    }
    if (role && role !== 'ADMIN' && role !== 'MEMBER') {
      return NextResponse.json({ error: 'Doorka waa inuu ahaadaa ADMIN ama MEMBER.' }, { status: 400 });
    }

    const user = await adminCreateUser({ name, email, password, role, studentId, department });
    addAuditLog(auth.payload.userId, auth.payload.name, 'CREATE_USER', `Akoon cusub oo la abuuray: ${user.email} (${user.role})`);
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.name === 'EmailTakenError') {
      return NextResponse.json({ error: 'Iimaylkan mar hore ayaa loo isticmaalay.' }, { status: 409 });
    }
    return handleError(err, 'POST /api/admin/users');
  }
}
