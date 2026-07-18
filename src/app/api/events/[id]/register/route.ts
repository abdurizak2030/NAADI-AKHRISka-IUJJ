import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { requireAuth } from '@/lib/server/auth';
import { toggleRegistration } from '@/lib/server/repositories/events.repository';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const event = await toggleRegistration(id, auth.payload.email);
    if (!event) return NextResponse.json({ error: 'Kulanka lama helin.' }, { status: 404 });
    return NextResponse.json(event);
  } catch (err) {
    return handleError(err, 'POST /api/events/[id]/register');
  }
}
