import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calendar, Clock, Eye } from 'lucide-react';
import { getArticlePageData } from '@/lib/server/public-data';
import { absoluteUrl, articlePath, articleUrl, SITE_NAME } from '@/lib/site';
import { mediaUrl } from '@/lib/api';
import { formatDate } from '@/lib/format';
import ArticleBody from '@/components/articles/ArticleBody';
import ArticleActions from '@/components/articles/ArticleActions';
import ArticleCard, { CoverFallback } from '@/components/articles/ArticleCard';
import CommentSection from '@/components/articles/CommentSection';
import FollowButton from '@/components/articles/FollowButton';
import ReadingProgress from '@/components/articles/ReadingProgress';
import ViewTracker from '@/components/articles/ViewTracker';

// Cached + refreshed on demand (admin edits call revalidatePath) and at most every 5 minutes.
export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

function plain(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').replace(/[#>*_`-]+\s?/g, '').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  let data;
  try {
    data = await getArticlePageData(slug);
  } catch {
    return { title: 'Article' };
  }
  if (!data) return { title: 'Article not found', robots: { index: false } };
  const a = data.article;
  const title = a.seoTitle || a.title;
  const description = a.seoDescription || a.summary || plain(a.content, 160);
  const url = articleUrl(a.slug);
  // Social image priority: dedicated sharing image → cover → site logo. Always absolute.
  const image = absoluteUrl(mediaUrl(a.ogImageUrl || a.imageUrl) || '/logo.png');

  return {
    title,
    description,
    alternates: { canonical: url },
    authors: [{ name: a.authorName }],
    keywords: a.tags,
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title,
      description,
      locale: a.language === 'Arabic' ? 'ar' : a.language === 'Somali' ? 'so' : 'en',
      publishedTime: a.publishedAt,
      authors: [a.authorName],
      section: a.category || undefined,
      tags: a.tags,
      images: [{ url: image, alt: a.title, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const data = await getArticlePageData(slug);
  if (!data) notFound();
  const { article: a, related, adjacent } = data;

  const path = articlePath(a.slug);
  const cover = mediaUrl(a.imageUrl);
  const rtl = a.language === 'Arabic';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.seoDescription || a.summary || plain(a.content, 160),
    image: [absoluteUrl(mediaUrl(a.ogImageUrl || a.imageUrl) || '/logo.png')],
    datePublished: a.publishedAt,
    dateModified: a.publishedAt,
    inLanguage: a.language === 'Arabic' ? 'ar' : a.language === 'Somali' ? 'so' : 'en',
    keywords: a.tags.join(', '),
    articleSection: a.category || undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl(a.slug) },
    author: { '@type': 'Person', name: a.authorName },
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') } },
  };
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Articles', item: absoluteUrl('/articles') },
      { '@type': 'ListItem', position: 3, name: a.title, item: articleUrl(a.slug) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbs]).replace(/</g, '\\u003c') }} />
      <ReadingProgress targetId="article-content" />
      <ViewTracker articleId={a.id} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-16">
        <nav aria-label="Breadcrumb" className="mb-5 text-xs text-gray-500 dark:text-emerald-100/50">
          <Link href="/articles" className="inline-flex items-center gap-1.5 font-semibold hover:text-emerald-800 dark:hover:text-amber-300">
            <ArrowLeft className="w-3.5 h-3.5" /> All articles
          </Link>
        </nav>

        {/* Cover */}
        <header className="relative overflow-hidden rounded-[2rem] bg-emerald-950 shadow-2xl">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full">
            {cover ? <Image src={cover} alt="" fill priority sizes="(min-width:1280px) 1200px, 100vw" className="object-cover" /> : <CoverFallback title={a.title} />}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/55 to-emerald-950/5" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-10" dir={rtl ? 'rtl' : undefined}>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-300">
              {a.category && <Link href={`/articles?category=${encodeURIComponent(a.category)}`} className="rounded-full bg-amber-400/20 px-3 py-1 backdrop-blur hover:bg-amber-400/30">{a.category}</Link>}
              <span className="opacity-70">{a.language}</span>
            </div>
            <h1 className="mt-3 max-w-4xl font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{a.title}</h1>
          </div>
        </header>

        {/* Meta row */}
        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-between gap-4 px-1">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-emerald-100/60">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-amber-300">{a.authorName.slice(0, 1).toUpperCase()}</span>
              <Link href={`/articles?author=${encodeURIComponent(a.authorName)}`} className="font-bold text-emerald-950 dark:text-emerald-50 hover:underline">{a.authorName}</Link>
            </span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" /><time dateTime={a.publishedAt}>{formatDate(a.publishedAt ?? a.createdAt)}</time></span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" />{a.readingMinutes} min read</span>
            <span className="inline-flex items-center gap-1.5"><Eye className="w-4 h-4" />{a.viewsCount.toLocaleString('en')} views</span>
          </div>
          <div className="flex items-center gap-2">
            <FollowButton kind="author" value={a.authorName} subject={a.authorName} size="sm" />
            {a.category && <FollowButton kind="category" value={a.category} subject={a.category} size="sm" className="!bg-transparent !text-emerald-900 dark:!text-amber-300 border !border-emerald-800/25 !shadow-none" />}
          </div>
        </div>

        {/* Body + action rail */}
        <div className="mx-auto mt-8 grid max-w-6xl lg:grid-cols-[5rem_minmax(0,48rem)_5rem] justify-center gap-6">
          <ArticleActions articleId={a.id} title={a.title} path={path} absoluteUrl={articleUrl(a.slug)} initial={{ likes: a.likesCount, views: a.viewsCount, shares: a.sharesCount, comments: a.commentsCount }} />
          <div className="min-w-0">
            <div id="article-content">
              {a.summary && <p className="mb-8 border-l-4 border-amber-500 pl-5 text-lg italic leading-relaxed text-gray-600 dark:text-emerald-100/70" dir={rtl ? 'rtl' : undefined}>{a.summary}</p>}
              <ArticleBody content={a.content} rtl={rtl} />
              {a.tags.length > 0 && (
                <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
                  {a.tags.map((tag) => (
                    <li key={tag}><Link href={`/articles?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-emerald-800/15 dark:border-amber-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-900 dark:text-amber-300 hover:bg-amber-400/15">#{tag}</Link></li>
                  ))}
                </ul>
              )}
            </div>

            {/* Subscribe card */}
            <div className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-950 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-amber-300">Never miss a new article</h3>
                <p className="mt-1 text-sm text-emerald-100/70">Get notified when the Reading Club publishes something new.</p>
              </div>
              <FollowButton kind="all" />
            </div>

            {/* Prev / Next */}
            {(adjacent.previous || adjacent.next) && (
              <nav aria-label="More articles" className="mt-10 grid gap-4 sm:grid-cols-2">
                {adjacent.previous ? (
                  <Link href={articlePath(adjacent.previous.slug)} className="group rounded-2xl border border-emerald-900/10 dark:border-amber-500/15 bg-white dark:bg-[#0d1f16] p-5 transition hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-lg">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600"><ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" /> Previous</span>
                    <span className="mt-2 block font-bold text-emerald-950 dark:text-emerald-50 line-clamp-2">{adjacent.previous.title}</span>
                  </Link>
                ) : <span />}
                {adjacent.next ? (
                  <Link href={articlePath(adjacent.next.slug)} className="group rounded-2xl border border-emerald-900/10 dark:border-amber-500/15 bg-white dark:bg-[#0d1f16] p-5 text-right transition hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-lg">
                    <span className="flex items-center justify-end gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600">Next <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" /></span>
                    <span className="mt-2 block font-bold text-emerald-950 dark:text-emerald-50 line-clamp-2">{adjacent.next.title}</span>
                  </Link>
                ) : <span />}
              </nav>
            )}

            <div className="mt-14"><CommentSection articleId={a.id} /></div>
          </div>
          <div className="hidden lg:block" aria-hidden="true" />
        </div>

        {related.length > 0 && (
          <section className="mx-auto mt-20 max-w-7xl" aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-950 dark:text-emerald-50">Related articles</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <ArticleCard key={r.id} article={r} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
