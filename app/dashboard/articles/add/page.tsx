'use client';

import ArticleEditor from '@/components/dashboard/article-editor';

export default function AddArticlePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ajouter un article</h1>
      <ArticleEditor mode="add" />
    </div>
  );
}
