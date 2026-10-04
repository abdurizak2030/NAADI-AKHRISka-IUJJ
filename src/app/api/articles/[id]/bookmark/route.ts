import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { getAuthPayload } from '@/lib/server/auth';
import { toggleArticleBookmark } from '@/lib/server/repositories/articles.repository';
import { getArticleLikeUserKey } from '@/lib/server/utils/article-like';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const { id } = await params;
    const userKey = getArticleLikeUserKey(request, getAuthPayload(request));
    const result = await toggleArticleBookmark(id, userKey);
    if (!result) return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err, 'POST /api/articles/[id]/bookmark');
  }
}
