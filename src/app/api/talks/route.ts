import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { createTalk, listTalks } from '@/lib/server/repositories/media.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET() {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    return NextResponse.json(await listTalks());
  } catch (err) {
    return handleError(err, 'GET /api/talks');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await safeJsonBody(request);
    const { title, speaker } = body;
    if (!title || !speaker) {
      return NextResponse.json({ error: 'Fadlan buuxi magaca iyo cod-kariyeha.' }, { status: 400 });
    }
    const talk = await createTalk(body);
    addAuditLog(auth.payload.userId, auth.payload.name, 'CREATE_TALK', `Lagu daray falanqayn maqal ah: ${title}`);
    return NextResponse.json(talk, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/talks');
  }
}
