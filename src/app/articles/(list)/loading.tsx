import { ArticleCardSkeleton } from '@/components/articles/ArticleCard';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12" role="status" aria-label="Loading articles">
      <div className="h-10 w-64 rounded-xl skeleton mb-8" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <ArticleCardSkeleton key={i} />)}</div>
    </div>
  );
}
