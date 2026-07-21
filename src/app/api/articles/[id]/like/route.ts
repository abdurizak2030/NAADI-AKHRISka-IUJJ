import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { getAuthPayload } from '@/lib/server/auth';
import { toggleArticleLike } from '@/lib/server/repositories/articles.repository';
import { getArticleLikeUserKey } from '@/lib/server/utils/article-like';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const { id } = await params;
    const auth = getAuthPayload(request);
    const userKey = getArticleLikeUserKey(request, auth);
    const result = await toggleArticleLike(id, userKey);
    if (!result) return NextResponse.json({ error: 'Maqaalka lama helin.' }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err, 'POST /api/articles/[id]/like');
  }
}