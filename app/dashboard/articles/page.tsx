'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Upload, Download, Edit, Trash2 } from 'lucide-react';
import AvailableButton from '@/components/dashboard/widget/available-button';
import { Article } from '@/interfaces/article';
import { categories } from '@/service/constants';
import { getArticles, deleteArticle, toggleArticleActive, createArticle } from '@/service/firebase/database';
import toast from 'react-hot-toast';

export default function ArticlesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setArticles(await getArticles());
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  const filteredArticles = articles.filter((a) => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

  function stockOf(a: Article): number {
    return a.hasVariants && a.variants?.length
      ? a.variants.reduce((s, v) => s + (v.stock ?? 0), 0)
      : (a.totalStock ?? 0);
  }

  const exportCSV = () => {
    const headers = ['ID', 'Titre', 'Catégorie', 'Prix', 'Stock', 'Statut'];
    const rows = filteredArticles.map((a) => [
      a.id, `"${a.title.replace(/"/g, '""')}"`, categories[a.category]?.name || a.category,
      a.price, stockOf(a), a.active ? 'Actif' : 'Inactif',
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'articles.csv';
    link.click();
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error('CSV vide');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const ti = headers.indexOf('titre');
      const pi = headers.indexOf('prix');
      if (ti === -1 || pi === -1) {
        toast.error('Colonnes titre et prix requises');
        return;
      }
      const ci = headers.indexOf('categorie');
      const si = headers.indexOf('stock');
      let created = 0;
      for (const line of lines.slice(1)) {
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const title = cols[ti];
        const price = Number(cols[pi]);
        if (!title || !(price > 0)) continue;
        await createArticle({
          title,
          description: '',
          price,
          category: ci >= 0 ? Math.max(categories.findIndex((c) => c.name.toLowerCase() === (cols[ci] || '').toLowerCase()), 0) : 0,
          thumbnail: '',
          screenshots: [],
          active: true,
          totalStock: si >= 0 ? Number(cols[si]) || 0 : 0,
          hasVariants: false,
          variants: [],
          createdAt: new Date().toISOString(),
        });
        created++;
      }
      toast.success(`${created} article(s) importé(s)`);
      await load();
    } catch {
      toast.error("Échec de l'import");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await toggleArticleActive(id, !current);
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
    } catch {
      toast.error('Erreur de mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteArticle(deleteId);
      setArticles((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success('Article supprimé');
    } catch {
      toast.error('Erreur de suppression');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Articles ({articles.length})</h1>
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
              {filteredArticles.map((article) => {
                const stock = stockOf(article);
                return (
                  <tr key={article.id} className="text-sm hover:bg-gray-50">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                        {article.thumbnail && <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-900 max-w-[220px] truncate">{article.title}</td>
                    <td className="p-4 text-gray-600">{categories[article.category]?.name ?? article.category}</td>
                    <td className="p-4 font-medium text-gray-900">{article.price.toLocaleString()} DZD</td>
                    <td className="p-4">
                      <span className={stock === 0 ? 'text-red-600 font-medium' : stock <= 5 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                        {stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <AvailableButton isActive={article.active} onClick={() => toggleActive(article.id, article.active)} />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link href={`/dashboard/articles/${article.id}`} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors inline-flex">
                        <Edit size={18} />
                      </Link>
                      <button onClick={() => setDeleteId(article.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors inline-flex">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredArticles.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Aucun article. Ajoutez-en un pour commencer.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold mb-2">Supprimer cet article ?</h3>
            <p className="text-sm text-gray-500 mb-4">Cette action est irréversible.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border rounded-xl text-sm">Annuler</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
