import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin, getAuthPayload } from '@/lib/server/auth';
import { createEvent, listEvents } from '@/lib/server/repositories/events.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const events = await listEvents();

    // Members-only events are hidden from anyone who isn't signed in —
    // this is a lightweight, optional auth check (no 401 on a missing
    // token) since the public event list must stay accessible to guests.
    const isSignedIn = !!getAuthPayload(request);
    const visible = isSignedIn ? events : events.filter((e) => e.visibility !== 'PRIVATE');
    return NextResponse.json(visible);
  } catch (err) {
    return handleError(err, 'GET /api/events');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await safeJsonBody(request);
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const date = typeof body?.date === 'string' ? body.date.trim() : '';
    const time = typeof body?.time === 'string' ? body.time.trim() : '';
    const location = typeof body?.location === 'string' ? body.location.trim() : 'Islamic University Campus';
    const visibility = body?.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';

    if (!title || !date || !time) {
      return NextResponse.json({ error: 'Buuxi mawduuca, taariikhda iyo waqtiga.' }, { status: 400 });
    }
    if (description.length > 4000 || title.length > 140 || location.length > 200) {
      return NextResponse.json({ error: 'Macluumaadka kulan wuu ka dheeraaday xadka ugu badan.' }, { status: 400 });
    }
    const event = await createEvent({ ...body, title, description, date, time, location, visibility });
    addAuditLog(auth.payload.userId, auth.payload.name, 'CREATE_EVENT', `Lagu dhawaaqay kulan cusub: ${title}`);
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/events');
  }
}
