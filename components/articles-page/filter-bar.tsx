'use client';

import { Filter, Star, X } from 'lucide-react';

const categories = [
  { id: 'vetements', label: 'Vêtements' },
  { id: 'chaussures', label: 'Chaussures' },
  { id: 'accessoires', label: 'Accessoires' },
];

interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  minRating: number;
  brand: string;
}

interface FilterBarProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  onClose?: () => void;
}

export default function FilterBar({ filters, setFilters, onClose }: FilterBarProps) {
  const handleCategoryChange = (cat: string) => {
    const updated = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    setFilters({ ...filters, categories: updated });
  };

  const resetFilters = () => {
    setFilters({
      categories: [],
      minPrice: '',
      maxPrice: '',
      inStock: false,
      minRating: 0,
      brand: ''
    });
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          Filtres
        </h2>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Catégories</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat.id)}
                onChange={() => handleCategoryChange(cat.id)}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600"
              />
              <span className="text-gray-600">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Prix (DA)</h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Disponibilité</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600"
          />
          <span className="text-gray-600">En stock uniquement</span>
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Note minimale</h3>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilters({ ...filters, minRating: filters.minRating === rating ? 0 : rating })}
              className={`p-1 rounded-md transition-colors ${
                filters.minRating >= rating ? 'text-yellow-400' : 'text-gray-300'
              } hover:bg-gray-50`}
            >
              <Star className="w-6 h-6 fill-current" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Marque</h3>
        <input
          type="text"
          placeholder="Rechercher une marque..."
          value={filters.brand}
          onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
      </div>

      <button
        onClick={resetFilters}
        className="w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
