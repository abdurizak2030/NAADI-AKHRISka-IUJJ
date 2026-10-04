import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { getAuthPayload } from '@/lib/server/auth';
import { getArticleEngagementState } from '@/lib/server/repositories/articles.repository';
import { getArticleLikeUserKey } from '@/lib/server/utils/article-like';

/** Per-reader state (liked / bookmarked) + live counters. Kept out of the cached article page on purpose. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const { id } = await params;
    const userKey = getArticleLikeUserKey(request, getAuthPayload(request));
    const state = await getArticleEngagementState(id, userKey);
    if (!state) return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    return NextResponse.json(state, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    return handleError(err, 'GET /api/articles/[id]/state');
  }
}
