import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { countUsers } from '@/lib/server/repositories/user.repository';
import { listArticles } from '@/lib/server/repositories/articles.repository';
import { listEvents } from '@/lib/server/repositories/events.repository';
import { listPdfs, listVideos, listGallery } from '@/lib/server/repositories/media.repository';

export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const [users, articles, events, pdfs, videos, gallery] = await Promise.all([
      countUsers(),
      listArticles(false),
      listEvents(),
      listPdfs(),
      listVideos(),
      listGallery(),
    ]);

    const now = new Date();
    const upcomingEvents = events.filter((e) => e.status === 'UPCOMING').length;
    const publishedArticles = articles.filter((a) => a.status === 'PUBLISHED').length;

    return NextResponse.json({
      users,
      content: {
        articles: articles.length,
        publishedArticles,
        draftArticles: articles.length - publishedArticles,
        pdfs: pdfs.length,
        videos: videos.length,
        gallery: gallery.length,
        events: events.length,
        upcomingEvents,
      },
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    return handleError(err, 'GET /api/admin/overview');
  }
}
