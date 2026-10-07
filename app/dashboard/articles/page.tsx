'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Upload, Download, Edit, Trash2 } from 'lucide-react';
import AvailableButton from '@/components/dashboard/widget/available-button';

const mockArticles = [
  { id: '1', title: 'T-Shirt Basique', category: 'Vêtements', price: 2500, stock: 150, active: true, image: '/placeholder.jpg' },
  { id: '2', title: 'Sneakers Pro', category: 'Chaussures', price: 12000, stock: 45, active: true, image: '/placeholder.jpg' },
  { id: '3', title: 'Montre Classique', category: 'Accessoires', price: 8500, stock: 0, active: false, image: '/placeholder.jpg' },
];

export default function ArticlesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState(mockArticles);

  const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const exportCSV = () => {
    const headers = ['ID', 'Titre', 'Catégorie', 'Prix', 'Stock', 'Statut'];
    const rows = filteredArticles.map(a => [a.id, a.title, a.category, a.price, a.stock, a.active ? 'Actif' : 'Inactif']);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'articles.csv';
    link.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dummy import
      alert('Import CSV: ' + file.name);
    }
  };

  const toggleActive = (id: string, current: boolean) => {
    setArticles(articles.map(a => a.id === id ? { ...a, active: !current } : a));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white">
            <Upload size={16} /> Importer
            <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
          </label>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white">
            <Download size={16} /> Exporter
          </button>
          <Link href="/dashboard/articles/add" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus size={16} /> Ajouter
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Rechercher un article..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="p-4 font-medium w-16">Image</th>
                <th className="p-4 font-medium">Titre</th>
                <th className="p-4 font-medium">Catégorie</th>
                <th className="p-4 font-medium">Prix</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredArticles.map((article) => (
                <tr key={article.id} className="text-sm hover:bg-gray-50">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{article.title}</td>
                  <td className="p-4 text-gray-600">{article.category}</td>
                  <td className="p-4 font-medium text-gray-900">{article.price} DZD</td>
                  <td className="p-4">
                    <span className={article.stock === 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {article.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <AvailableButton isActive={article.active} onClick={() => toggleActive(article.id, article.active)} />
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link href={`/dashboard/articles/${article.id}`} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors inline-flex">
                      <Edit size={18} />
                    </Link>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors inline-flex">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
