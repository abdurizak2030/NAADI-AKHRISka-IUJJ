import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { createVideo, listVideos } from '@/lib/server/repositories/media.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET() {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    return NextResponse.json(await listVideos());
  } catch (err) {
    return handleError(err, 'GET /api/videos');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await safeJsonBody(request);
    const { title, youtubeId, videoUrl } = body;
    if (!title || (!youtubeId && !videoUrl)) {
      return NextResponse.json({ error: 'Mada iyo YouTube link ama URL muuqaal ah waa lagama maarmaan.' }, { status: 400 });
    }
    const video = await createVideo(body);
    addAuditLog(auth.payload.userId, auth.payload.name, 'CREATE_VIDEO', `La geliyey muuqaal cusub: ${title}`);
    return NextResponse.json(video, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/videos');
  }
}
