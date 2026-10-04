import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, Eye, Heart, MessageCircle } from 'lucide-react';
import { mediaUrl } from '../../lib/api';
import { articlePath } from '../../lib/site';
import { compactNumber, formatDate } from '../../lib/format';
import type { Article } from '../../types';

/** Cover placeholder used when an article has no image — keeps the grid rhythm intact. */
export function CoverFallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950" aria-hidden="true">
      <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_30%_20%,#D4AF37_0,transparent_45%)]" />
      <BookOpen className="w-10 h-10 text-amber-300/80 relative" />
      <span className="sr-only">{title}</span>
    </div>
  );
}

interface Props {
  article: Article;
  featured?: boolean;
  priority?: boolean;
}

export default function ArticleCard({ article, featured = false, priority = false }: Props) {
  const href = articlePath(article.slug);
  const cover = mediaUrl(article.imageUrl);
  const rtl = article.language === 'Arabic';

  return (
    <article
      className={`group relative flex overflow-hidden rounded-3xl border border-emerald-900/10 dark:border-amber-500/10 bg-white dark:bg-[#0d1f16] shadow-[0_1px_2px_rgba(8,71,32,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(8,71,32,0.45)] hover:border-amber-500/40 ${featured ? 'flex-col lg:flex-row lg:min-h-[22rem]' : 'flex-col'}`}
    >
      <Link href={href} className="absolute inset-0 z-10" aria-label={article.title} />

      <div className={`relative overflow-hidden bg-emerald-900/10 ${featured ? 'aspect-[16/10] lg:aspect-auto lg:w-[55%]' : 'aspect-[16/10]'}`}>
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes={featured ? '(min-width:1024px) 55vw, 100vw' : '(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw'}
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <CoverFallback title={article.title} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/45 via-transparent to-transparent opacity-70" />
        {article.category && (
          <span className="absolute left-4 top-4 z-20 rounded-full bg-white/90 dark:bg-emerald-950/80 backdrop-blur px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-900 dark:text-amber-300 shadow">
            {article.category}
          </span>
        )}
        {article.featured && !featured && (
          <span className="absolute right-4 top-4 z-20 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-950">Featured</span>
        )}
      </div>

      <div className={`flex flex-1 flex-col gap-3 p-5 sm:p-6 ${featured ? 'lg:w-[45%] lg:justify-center lg:p-10' : ''}`} dir={rtl ? 'rtl' : undefined}>
        <h3 className={`font-display font-extrabold leading-snug tracking-tight text-emerald-950 dark:text-emerald-50 transition-colors group-hover:text-emerald-700 dark:group-hover:text-amber-300 ${featured ? 'text-2xl sm:text-3xl line-clamp-3' : 'text-lg sm:text-xl line-clamp-2'}`}>
          {article.title}
        </h3>
        {article.summary && <p className={`text-sm leading-relaxed text-gray-500 dark:text-emerald-100/60 ${featured ? 'line-clamp-4' : 'line-clamp-3'}`}>{article.summary}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3 text-xs text-gray-500 dark:text-emerald-100/55">
          <span className="font-semibold text-emerald-900 dark:text-amber-300/90">{article.authorName}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt ?? article.createdAt)}</time>
          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{article.readingMinutes} min</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-emerald-100/40">
          <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{compactNumber(article.viewsCount)}</span>
          <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{compactNumber(article.likesCount)}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{compactNumber(article.commentsCount)}</span>
        </div>
      </div>
    </article>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-900/10 dark:border-amber-500/10 bg-white dark:bg-[#0d1f16]" aria-hidden="true">
      <div className="aspect-[16/10] skeleton" />
      <div className="space-y-3 p-6">
        <div className="h-5 w-4/5 rounded-md skeleton" />
        <div className="h-3 w-full rounded-md skeleton" />
        <div className="h-3 w-2/3 rounded-md skeleton" />
        <div className="h-3 w-1/2 rounded-md skeleton mt-4" />
      </div>
    </div>
  );
}
