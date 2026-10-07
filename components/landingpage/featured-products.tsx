import React from 'react';
import ItemCard from '../general/item-card';
import { Article } from '@/interfaces/article';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface FeaturedProductsProps {
  products: Article[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Produits Vedettes</h2>
          <p className="text-gray-600">Découvrez notre sélection des meilleurs articles du moment.</p>
        </div>
        <Link href="/articles" className="group flex items-center text-indigo-600 font-semibold hover:text-indigo-700 transition-colors hidden sm:flex">
          Voir tout
          <ArrowRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <ItemCard key={product.id} article={product} />
        ))}
      </div>
      
      <div className="mt-8 text-center sm:hidden">
        <Link href="/articles" className="inline-flex items-center justify-center px-6 py-3 w-full border-2 border-indigo-100 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors">
          Voir tous les produits
        </Link>
      </div>
    </section>
  );
}
