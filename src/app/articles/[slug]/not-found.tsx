import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-amber-600">404</p>
      <h1 className="mt-3 font-display text-3xl font-extrabold text-emerald-950 dark:text-emerald-50">This article isn’t available</h1>
      <p className="mt-3 text-gray-500">It may have been unpublished or the link is mistyped.</p>
      <Link href="/articles" className="mt-8 inline-block rounded-xl gold-gradient-bg px-6 py-3 text-sm font-bold text-emerald-950">Browse all articles</Link>
    </div>
  );
}
