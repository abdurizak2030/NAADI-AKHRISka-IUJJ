import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { findUserWithPasswordByEmail, verifyPassword } from '@/lib/server/repositories/user.repository';
import { signToken } from '@/lib/server/utils/token';

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;

  try {
    const body = await safeJsonBody(request);
    const { email, password } = body;
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Fadlan qor iimaylka iyo erayga sirta ah.' }, { status: 400 });
    }

    const user = await findUserWithPasswordByEmail(email.trim());
    if (!user) {
      return NextResponse.json({ error: 'Iimaylka ama erayga sirta ah waa qalad.' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Akoonkan waa la joojiyay (disabled). Fadlan la xiriir maamulaha.' }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Iimaylka ama erayga sirta ah waa qalad.' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const { passwordHash: _passwordHash, ...publicUser } = user;
    return NextResponse.json({ token, user: publicUser });
  } catch (err) {
    return handleError(err, 'POST /api/auth/login');
  }
}
