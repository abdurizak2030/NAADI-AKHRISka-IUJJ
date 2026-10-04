import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { getAuthPayload } from '@/lib/server/auth';
import { listBookmarkedArticles } from '@/lib/server/repositories/articles.repository';
import { getArticleLikeUserKey } from '@/lib/server/utils/article-like';

export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const userKey = getArticleLikeUserKey(request, getAuthPayload(request));
    return NextResponse.json(await listBookmarkedArticles(userKey), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    return handleError(err, 'GET /api/bookmarks');
  }
}
