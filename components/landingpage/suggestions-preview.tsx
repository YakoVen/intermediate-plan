import React from 'react';
import ItemCard from '../general/item-card';
import { Article } from '@/interfaces/article';

interface SuggestionsPreviewProps {
  products: Article[];
}

export default function SuggestionsPreview({ products }: SuggestionsPreviewProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Vous aimerez aussi</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.slice(0, 4).map((product) => (
          <ItemCard key={product.id} article={product} />
        ))}
      </div>
    </section>
  );
}
