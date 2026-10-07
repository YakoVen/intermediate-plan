'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import FilterBar from './filter-bar';
import { Article } from '@/interfaces/article';

// Placeholder ItemCard
function ItemCard({ product }: { product: Article }) {
  return <div className="p-4 border rounded-xl">{product.title}</div>;
}

export default function ArticlesListing({ initialArticles }: { initialArticles: Article[] }) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const [filters, setFilters] = useState<{
    categories: string[];
    minPrice: string;
    maxPrice: string;
    inStock: boolean;
    minRating: number;
    brand: string;
  }>({
    categories: [],
    minPrice: '',
    maxPrice: '',
    inStock: false,
    minRating: 0,
    brand: ''
  });

  const activeFilterCount = filters.categories.length + 
    (filters.minPrice ? 1 : 0) + 
    (filters.maxPrice ? 1 : 0) + 
    (filters.inStock ? 1 : 0) + 
    (filters.minRating > 0 ? 1 : 0) + 
    (filters.brand ? 1 : 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <FilterBar filters={filters} setFilters={setFilters} />
        </div>

        {/* Mobile Filter Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex justify-end">
            <div className="w-80 bg-white h-full overflow-y-auto">
              <FilterBar filters={filters} setFilters={setFilters} onClose={() => setShowMobileFilters(false)} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher des produits..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="md:hidden relative px-4 py-2 bg-gray-100 rounded-xl flex items-center gap-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-indigo-600 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="newest">Les plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating">Mieux notés</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {initialArticles.map((product) => (
              <ItemCard key={product.id} product={product} />
            ))}
          </div>

          {initialArticles.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              Aucun produit ne correspond à vos critères.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
