import React from 'react';
import Link from 'next/link';

const categories = [
  { id: '1', name: 'Électronique', icon: '📱', color: 'bg-purple-100 text-purple-700', hover: 'hover:bg-purple-200' },
  { id: '2', name: 'Mode Homme', icon: '👕', color: 'bg-blue-100 text-blue-700', hover: 'hover:bg-blue-200' },
  { id: '3', name: 'Mode Femme', icon: '👗', color: 'bg-pink-100 text-pink-700', hover: 'hover:bg-pink-200' },
  { id: '4', name: 'Maison', icon: '🏠', color: 'bg-orange-100 text-orange-700', hover: 'hover:bg-orange-200' },
  { id: '5', name: 'Beauté', icon: '✨', color: 'bg-green-100 text-green-700', hover: 'hover:bg-green-200' },
  { id: '6', name: 'Accessoires', icon: '⌚', color: 'bg-gray-100 text-gray-700', hover: 'hover:bg-gray-200' },
];

export default function CategoriesPreviews() {
  return (
    <section className="py-12">
      <div className="flex justify-between items-end mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Parcourir par catégorie</h2>
        <Link href="/categories" className="text-indigo-600 font-medium hover:underline hidden sm:block">
          Voir tout
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/articles?category=${category.name.toLowerCase()}`}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 ${category.color} ${category.hover} shadow-sm hover:shadow-md`}
          >
            <span className="text-4xl mb-3">{category.icon}</span>
            <span className="font-semibold text-center text-sm md:text-base">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
