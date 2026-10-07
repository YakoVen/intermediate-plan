'use client';

import { use } from 'react';
import ArticleEditor from '@/components/dashboard/article-editor';

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;article</h1>
      <ArticleEditor mode="edit" articleId={resolvedParams.id} />
    </div>
  );
}
