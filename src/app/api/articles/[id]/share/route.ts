import { NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { incrementArticleShares } from '@/lib/server/repositories/articles.repository';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const { id } = await params;
    const sharesCount = await incrementArticleShares(id);
    if (sharesCount === null) return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    return NextResponse.json({ sharesCount });
  } catch (err) {
    return handleError(err, 'POST /api/articles/[id]/share');
  }
}
