import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { requireAuth } from '@/lib/server/auth';
import { findUserById } from '@/lib/server/repositories/user.repository';

export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;

  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const user = await findUserById(auth.payload.userId);
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Xubinta lama helin.' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    return handleError(err, 'GET /api/auth/me');
  }
}
