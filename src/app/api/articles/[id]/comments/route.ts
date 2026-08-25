import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { getAuthPayload } from '@/lib/server/auth';
import { createComment, listCommentsForArticle } from '@/lib/server/repositories/articles.repository';
import { findUserById } from '@/lib/server/repositories/user.repository';

const EMAIL_RE = /^[^s@]+@[^s@]+.[^s@]+$/;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_COMMENT_LENGTH = 2000;

function sanitizeCommentPayload(body: Record<string, unknown>) {
  const authorName = typeof body.authorName === 'string' ? body.authorName.trim() : '';
  const rawEmail =
    typeof body.commenterEmail === 'string'
      ? body.commenterEmail
      : typeof body.email === 'string'
        ? body.email
        : '';
  const commenterEmail = rawEmail.trim().toLowerCase();
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  return { authorName, commenterEmail, content };
}

function validateComment(authorName: string, commenterEmail: string, content: string): string | null {
  if (!authorName || !commenterEmail || !content) {
    return 'Please enter your name, email, and comment.';
  }
  if (authorName.length < 2 || authorName.length > MAX_NAME_LENGTH) {
    return 'Name must be between 2 and 80 characters.';
  }
  if (commenterEmail.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(commenterEmail)) {
    return 'Please enter a valid email address.';
  }
  if (content.length < 2 || content.length > MAX_COMMENT_LENGTH) {
    return 'Comment must be between 2 and 2000 characters.';
  }
  return null;
}

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
    const body = (await safeJsonBody(request)) as Record<string, unknown>;
    const { authorName, commenterEmail, content } = sanitizeCommentPayload(body);
    const validationError = validateComment(authorName, commenterEmail, content);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    let finalAuthorId = 'guest';
    let finalAvatarUrl = '/logoIUJJ.jpg';

    const payload = getAuthPayload(request);
    if (payload) {
      const user = await findUserById(payload.userId);
      finalAuthorId = payload.userId;
      if (user?.avatarUrl) finalAvatarUrl = user.avatarUrl;
    }

    const comment = await createComment({
      articleId: id,
      authorId: finalAuthorId,
      authorName,
      commenterEmail,
      avatarUrl: finalAvatarUrl,
      content,
    });
    if (!comment) return NextResponse.json({ error: 'Maqaalka lama helin.' }, { status: 404 });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/articles/[id]/comments');
  }
}
