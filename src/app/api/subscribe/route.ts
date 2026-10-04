import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { getAuthPayload } from '@/lib/server/auth';
import { findUserById } from '@/lib/server/repositories/user.repository';
import { addFollower, isValidEmail, listFollowsForUser, normalizeFollow, removeFollower } from '@/lib/server/repositories/subscribers.repository';

/** Signed-in members: list what they follow (so the Follow button is correct on every device). */
export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const auth = getAuthPayload(request);
    if (!auth) return NextResponse.json([]);
    const user = await findUserById(auth.userId);
    if (!user) return NextResponse.json([]);
    return NextResponse.json(await listFollowsForUser(user.id, user.email), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    return handleError(err, 'GET /api/subscribe');
  }
}

async function resolveEmail(request: NextRequest, bodyEmail: unknown): Promise<{ email: string; userId?: string } | null> {
  const auth = getAuthPayload(request);
  if (auth) {
    const user = await findUserById(auth.userId);
    if (user) return { email: user.email, userId: user.id };
  }
  const email = typeof bodyEmail === 'string' ? bodyEmail.trim().toLowerCase() : '';
  return isValidEmail(email) ? { email } : null;
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const body = await safeJsonBody(request);
    const follow = normalizeFollow(body.kind, body.value);
    if (!follow) return NextResponse.json({ error: 'Choose what you want to follow.' }, { status: 400 });
    const who = await resolveEmail(request, body.email);
    if (!who) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    await addFollower(who.email, follow, who.userId);
    // The email is never echoed back.
    return NextResponse.json({ following: true, follow }, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/subscribe');
  }
}

export async function DELETE(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const body = await safeJsonBody(request);
    const follow = normalizeFollow(body.kind, body.value);
    if (!follow) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    const who = await resolveEmail(request, body.email);
    if (!who) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    await removeFollower(who.email, follow);
    return NextResponse.json({ following: false, follow });
  } catch (err) {
    return handleError(err, 'DELETE /api/subscribe');
  }
}
