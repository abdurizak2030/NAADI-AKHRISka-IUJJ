import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { getAuthPayload, requireAuth } from '@/lib/server/auth';
import { createArticle, listArticleCards, listArticles, normalizeTags } from '@/lib/server/repositories/articles.repository';
import { revalidateArticles } from '@/lib/server/revalidate';
import { notifyFollowersOfPublishedArticle } from '@/lib/server/repositories/subscribers.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';
import { createNotification, getArticleSettings } from '@/lib/server/repositories/content.repository';
import { listUsers } from '@/lib/server/repositories/user.repository';
import { getArticleLikeUserKey } from '@/lib/server/utils/article-like';

function sanitizeArticlePayload(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const language =
    typeof body.language === 'string' && ['Somali', 'Arabic', 'English'].includes(body.language) ? body.language : 'Somali';
  const status = body.status === 'PUBLISHED' ? 'PUBLISHED' : body.status === 'PENDING' ? 'PENDING' : 'DRAFT';
  const imageUrl = typeof body.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : undefined;
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const tags = normalizeTags(body.tags);
  const seoTitle = typeof body.seoTitle === 'string' ? body.seoTitle.trim().slice(0, 120) : '';
  const seoDescription = typeof body.seoDescription === 'string' ? body.seoDescription.trim().slice(0, 300) : '';
  const ogImageUrl = typeof body.ogImageUrl === 'string' && body.ogImageUrl.trim() ? body.ogImageUrl.trim() : undefined;
  const featured = body.featured === true;
  return { title, content, summary, category, language, status, imageUrl, slug, tags, seoTitle, seoDescription, ogImageUrl, featured };
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
    // Paged, lightweight card list (no article bodies) — used by the public
    // Articles page and "load more". The legacy full list below is kept for
    // the member dashboard and admin console.
    const sp = request.nextUrl.searchParams;
    if (sp.has('page')) {
      const page = Math.max(Number(sp.get('page')) || 1, 1);
      const pageSize = Math.min(Math.max(Number(sp.get('limit')) || 9, 1), 30);
      const { items, total } = await listArticleCards({
        page,
        pageSize,
        category: sp.get('category') || undefined,
        language: sp.get('language') || undefined,
        author: sp.get('author') || undefined,
        tag: sp.get('tag') || undefined,
        q: sp.get('q') || undefined,
        featured: sp.get('featured') === '1',
      });
      return NextResponse.json(
        { items, total, page, pageSize, hasMore: page * pageSize < total },
        { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } }
      );
    }

    const auth = getAuthPayload(request);
    const likeUserKey = getArticleLikeUserKey(request, auth);
    const publishedOnly = request.nextUrl.searchParams.get('status') === 'PUBLISHED';

    if (publishedOnly || !auth) {
      return NextResponse.json(await listArticles(true, likeUserKey));
    }

    const articles = await listArticles(false, likeUserKey);
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
    const { title, content, summary, category, language, status, imageUrl, slug, tags, seoTitle, seoDescription, ogImageUrl, featured } = sanitizeArticlePayload(body);

    if (!title || !content) {
      return NextResponse.json({ error: 'Fadlan buuxi cinwaanka iyo qormada.' }, { status: 400 });
    }

    if (title.length > 140 || summary.length > 220 || content.length > 20000) {
      return NextResponse.json({ error: 'Titlka, koorsada, ama qormaanku way dhaafayaan xadka ugu badan.' }, { status: 400 });
    }

    const articleSettings = await getArticleSettings();
    if (!articleSettings.articlePublishingEnabled && status !== 'DRAFT') {
      return NextResponse.json({ error: 'Article publishing is currently disabled by an administrator.' }, { status: 403 });
    }

    if (payload.role !== 'ADMIN' && status === 'PUBLISHED') {
      return NextResponse.json({ error: 'Only admins can publish articles directly.' }, { status: 403 });
    }

    const articleStatus = payload.role === 'ADMIN' ? status : status === 'PENDING' ? 'PENDING' : 'DRAFT';
    const article = await createArticle({
      title,
      content,
      summary: summary || null,
      category,
      language,
      status: articleStatus,
      authorId: payload.userId,
      authorName: payload.name,
      imageUrl,
      slug,
      tags,
      seoTitle,
      seoDescription,
      ogImageUrl,
      featured: payload.role === 'ADMIN' ? featured : false,
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

    if (articleStatus === 'PUBLISHED') await notifyFollowersOfPublishedArticle(article);

    revalidateArticles(article.slug);
    return NextResponse.json(article, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/articles');
  }
}