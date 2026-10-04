import type { Metadata } from 'next';
import { getArticleCards, getCategories } from '@/lib/server/public-data';
import ArticleList from '@/components/articles/ArticleList';
import FollowButton from '@/components/articles/FollowButton';
import PageHeader from '@/components/PageHeader';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Essays, reflections and reading notes from the Islamic University of Jigjiga Reading Club.',
  alternates: { canonical: absoluteUrl('/articles') },
};

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function ArticlesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters = { q: one(sp.q), category: one(sp.category), language: one(sp.language), author: one(sp.author), tag: one(sp.tag) };
  const [initial, categories] = await Promise.all([getArticleCards({ page: 1, pageSize: 9, ...filters }), getCategories()]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <PageHeader eyebrowKey="articlesPage.badge" titleKey="articlesPage.title" subtitleKey="articlesPage.subtitle" action={<FollowButton kind="all" />} />
      <ArticleList initial={initial} categories={categories} filters={filters} />
    </div>
  );
}
