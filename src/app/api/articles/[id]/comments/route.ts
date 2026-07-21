import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { getAuthPayload } from '@/lib/server/auth';
import { createComment, listCommentsForArticle } from '@/lib/server/repositories/articles.repository';
import { findUserById } from '@/lib/server/repositories/user.repository';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const { id } = await params;
    return NextResponse.json(await listCommentsForArticle(id));
  } catch (err) {
    return handleError(err, 'GET /api/articles/[id]/comments');
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;

  try {
    const { id } = await params;
    const { content, authorName } = await safeJsonBody(request);
    if (!content) {
      return NextResponse.json({ error: 'Qoraalka faallada lagama maarmaan ah.' }, { status: 400 });
    }

    let finalAuthorName = authorName || 'Guest Scholar';
    let finalAuthorId = 'guest';
    let finalAvatarUrl = '/logoIUJJ.jpg';

    // Optional auth: signed-in commenters get their real name/avatar, but
    // guests may still comment (no 401 here) — mirrors the original route.
    const payload = getAuthPayload(request);
    if (payload) {
      const user = await findUserById(payload.userId);
      finalAuthorName = payload.name;
      finalAuthorId = payload.userId;
      if (user?.avatarUrl) finalAvatarUrl = user.avatarUrl;
    }

    const comment = await createComment({
      articleId: id,
      authorId: finalAuthorId,
      authorName: finalAuthorName,
      avatarUrl: finalAvatarUrl,
      content,
    });
    if (!comment) return NextResponse.json({ error: 'Maqaalka lama helin.' }, { status: 404 });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/articles/[id]/comments');
  }
}
