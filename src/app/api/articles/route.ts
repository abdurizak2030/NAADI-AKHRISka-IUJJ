import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { getAuthPayload, requireAuth } from '@/lib/server/auth';
import { createArticle, listArticles } from '@/lib/server/repositories/articles.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';
import { createNotification } from '@/lib/server/repositories/content.repository';
import { listUsers } from '@/lib/server/repositories/user.repository';

function sanitizeArticlePayload(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : 'General';
  const language =
    typeof body.language === 'string' && ['Somali', 'Arabic', 'English'].includes(body.language) ? body.language : 'Somali';
  const status = body.status === 'PUBLISHED' ? 'PUBLISHED' : body.status === 'PENDING' ? 'PENDING' : 'DRAFT';
  const imageUrl = typeof body.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : undefined;
  return { title, content, summary, category, language, status, imageUrl };
}

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

export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;

  try {
    const auth = getAuthPayload(request);
    const publishedOnly = request.nextUrl.searchParams.get('status') === 'PUBLISHED';

    if (publishedOnly || !auth) {
      return NextResponse.json(await listArticles(true));
    }

    const articles = await listArticles(false);
    if (auth.role === 'ADMIN') {
      return NextResponse.json(articles);
    }

    return NextResponse.json(
      articles.filter((article) => article.status === 'PUBLISHED' || article.authorId === auth.userId)
    );
  } catch (err) {
    return handleError(err, 'GET /api/articles');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;

  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const payload = auth.payload;
    const body = await safeJsonBody(request);
    const { title, content, summary, category, language, status, imageUrl } = sanitizeArticlePayload(body);

    if (!title || !content || !summary) {
      return NextResponse.json({ error: 'Fadlan buux dhammaan meelaha loo baahan yahay.' }, { status: 400 });
    }

    if (title.length > 140 || summary.length > 220 || content.length > 20000) {
      return NextResponse.json({ error: 'Titlka, koorsada, ama qormaanku way dhaafayaan xadka ugu badan.' }, { status: 400 });
    }

    if (payload.role !== 'ADMIN' && status === 'PUBLISHED') {
      return NextResponse.json({ error: 'Only admins can publish articles directly.' }, { status: 403 });
    }

    const articleStatus = payload.role === 'ADMIN' ? status : status === 'PENDING' ? 'PENDING' : 'DRAFT';
    const article = await createArticle({
      title,
      content,
      summary,
      category,
      language,
      status: articleStatus,
      authorId: payload.userId,
      authorName: payload.name,
      imageUrl,
    });

    addAuditLog(payload.userId, payload.name, 'CREATE_ARTICLE', `Lagu qoray maqaal cusub: ${title}`);

    if (articleStatus === 'PENDING') {
      await Promise.all([
        notifyAdminsOfPendingArticle(title, payload.name),
        createNotification({
          userId: payload.userId,
          title: 'Article submitted',
          message: `Your article "${title}" is pending admin approval.`,
        }),
      ]);
    }

    return NextResponse.json(article, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/articles');
  }
}