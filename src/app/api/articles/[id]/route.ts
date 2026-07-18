import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAuth } from '@/lib/server/auth';
import { deleteArticle, getArticleById, updateArticle } from '@/lib/server/repositories/articles.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';
import { createNotification } from '@/lib/server/repositories/content.repository';
import { listUsers } from '@/lib/server/repositories/user.repository';

async function notifyAdminsOfPendingArticle(articleTitle: string, authorName: string) {
  try {
    const admins = (await listUsers()).filter((user) => user.role === 'ADMIN' && user.isActive);
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          title: 'Article awaiting approval',
          message: `${authorName} submitted "${articleTitle}" for admin review.`,
        })
      )
    );
  } catch (err) {
    console.error('[notifications] Failed to notify admins about pending article:', err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;

  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const payload = auth.payload;

    const existing = await getArticleById(id);
    if (!existing) return NextResponse.json({ error: 'Maqaalka lama helin.' }, { status: 404 });

    if (payload.role !== 'ADMIN' && existing.authorId !== payload.userId) {
      return NextResponse.json({ error: 'Idmo kuuma oggola inaad beddesho maqaalkan.' }, { status: 403 });
    }

    const body = await safeJsonBody(request);
    const title = typeof body?.title === 'string' ? body.title.trim() : undefined;
    const content = typeof body?.content === 'string' ? body.content.trim() : undefined;
    const summary = typeof body?.summary === 'string' ? body.summary.trim() : undefined;
    const category = typeof body?.category === 'string' ? body.category.trim() : undefined;
    const language = ['Somali', 'Arabic', 'English'].includes(body?.language) ? body.language : undefined;
    const requestedStatus = body?.status === 'PUBLISHED' ? 'PUBLISHED' : body?.status === 'PENDING' ? 'PENDING' : body?.status === 'DRAFT' ? 'DRAFT' : undefined;
    const imageUrl = typeof body?.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : undefined;

    if (title !== undefined && title.length > 140) {
      return NextResponse.json({ error: 'Titlka wuu ka dheeraaday xadka ugu badan.' }, { status: 400 });
    }
    if (summary !== undefined && summary.length > 220) {
      return NextResponse.json({ error: 'Koorsada wuu ka dheeraaday xadka ugu badan.' }, { status: 400 });
    }
    if (content !== undefined && content.length > 20000) {
      return NextResponse.json({ error: 'Qormada wuu ka dheeraaday xadka ugu badan.' }, { status: 400 });
    }

    if (payload.role !== 'ADMIN' && requestedStatus === 'PUBLISHED') {
      return NextResponse.json({ error: 'Only admins can approve and publish articles.' }, { status: 403 });
    }

    const hasContentEdit = [title, content, summary, category, language, imageUrl].some((value) => value !== undefined);
    const nextStatus =
      payload.role === 'ADMIN'
        ? requestedStatus
        : requestedStatus ?? (existing.status === 'PUBLISHED' && hasContentEdit ? 'PENDING' : undefined);

    const article = await updateArticle(id, { title, content, summary, category, language, status: nextStatus, imageUrl });
    if (!article) return NextResponse.json({ error: 'Maqaalka lama helin.' }, { status: 404 });

    addAuditLog(payload.userId, payload.name, 'EDIT_ARTICLE', `Waxaa wax ka beddel lagu sameeyey maqaalka: ${article.title}`);

    if (payload.role === 'ADMIN' && nextStatus && nextStatus !== existing.status && existing.authorId) {
      if (nextStatus === 'PUBLISHED') {
        createNotification({
          userId: existing.authorId,
          title: 'Article approved',
          message: `Your article "${article.title}" has been approved and is now public.`,
        });
        addAuditLog(payload.userId, payload.name, 'APPROVE_ARTICLE', `La ansixiyey maqaalka: ${article.title}`);
      } else if (nextStatus === 'DRAFT') {
        createNotification({
          userId: existing.authorId,
          title: 'Article rejected',
          message: `Your article "${article.title}" was rejected and moved back to draft for revision.`,
        });
        addAuditLog(payload.userId, payload.name, 'REJECT_ARTICLE', `Dib loogu celiyey draft: ${article.title}`);
      }
    }

    if (payload.role !== 'ADMIN' && nextStatus === 'PENDING' && existing.status !== 'PENDING') {
      await Promise.all([
        notifyAdminsOfPendingArticle(article.title, payload.name),
        createNotification({
          userId: payload.userId,
          title: 'Article submitted',
          message: `Your article "${article.title}" is pending admin approval.`,
        }),
      ]);
    }

    return NextResponse.json(article);
  } catch (err) {
    return handleError(err, 'PUT /api/articles/[id]');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;

  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const payload = auth.payload;

    const existing = await getArticleById(id);
    if (!existing) return NextResponse.json({ error: 'Maqaalka lama helin.' }, { status: 404 });

    if (payload.role !== 'ADMIN' && existing.authorId !== payload.userId) {
      return NextResponse.json({ error: 'Idmo kuuma oggola inaad tirtirto maqaalkan.' }, { status: 403 });
    }

    await deleteArticle(id);
    addAuditLog(payload.userId, payload.name, 'DELETE_ARTICLE', `Loo tirtiray maqaal: ${existing.title}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/articles/[id]');
  }
}