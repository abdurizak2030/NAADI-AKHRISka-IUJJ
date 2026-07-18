import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAuth } from '@/lib/server/auth';
import { updateUserProfile } from '@/lib/server/repositories/user.repository';

// Self-service profile update — deliberately limited to non-sensitive
// fields. Email, role, and account status can only be changed by an
// administrator via /api/admin/users/:id.
export async function PUT(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;

  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const { name, bio, avatarUrl, department } = await safeJsonBody(request);
    const user = await updateUserProfile(auth.payload.userId, { name, bio, avatarUrl, department });
    if (!user) {
      return NextResponse.json({ error: 'Isticmaalaha lama helin.' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    return handleError(err, 'PUT /api/auth/profile');
  }
}
