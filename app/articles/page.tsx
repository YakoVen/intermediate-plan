import { Suspense } from 'react';
import ArticlesListing from '@/components/articles-page/articles-listing';
import { getArticles } from '@/service/firebase/database';

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search } = await searchParams;
  const articles = await getArticles({ active: true });
  const q = (search || '').toLowerCase();
  const filtered = q
    ? articles.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    : articles;

  return (
    <div>
      <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="h-64 bg-gray-100 rounded-xl animate-pulse" /></div>}>
        <ArticlesListing initialArticles={filtered} />
      </Suspense>
    </div>
  );
}
