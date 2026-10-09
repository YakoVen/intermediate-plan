'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Save, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Article, Variant } from '@/interfaces/article';
import { categories } from '@/service/constants';
import { getArticle, createArticle, updateArticle, logInventory } from '@/service/firebase/database';
import { uploadImage } from '@/service/firebase/storage';
import toast from 'react-hot-toast';

interface ArticleEditorProps {
  mode: 'add' | 'edit';
  articleId?: string;
}

const emptyForm = {
  title: '', description: '', price: 0, oldPrice: 0, category: 0,
  brand: '', collection: '', stock: 1, active: true, seoTitle: '', seoDescription: '',
};

export default function ArticleEditor({ mode, articleId }: ArticleEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [formData, setFormData] = useState(emptyForm);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [origStock, setOrigStock] = useState(0);

  useEffect(() => {
    if (mode === 'edit' && articleId) {
      getArticle(articleId)
        .then((a) => {
          if (!a) {
            toast.error('Article introuvable');
            router.push('/dashboard/articles');
            return;
          }
          setFormData({
            title: a.title, description: a.description, price: a.price,
            oldPrice: a.oldPrice || a.originalPrice || 0, category: a.category,
            brand: a.brand || '', collection: a.collection || '',
            stock: a.totalStock ?? 1, active: a.active,
            seoTitle: a.seoTitle || '', seoDescription: a.seoDescription || '',
          });
          setImages([a.thumbnail, ...(a.screenshots || [])].filter(Boolean));
          setHasVariants(!!a.hasVariants && (a.variants?.length || 0) > 0);
          setVariants(a.variants || []);
          setOrigStock(a.totalStock ?? 0);
        })
        .catch(() => toast.error('Erreur de chargement'))
        .finally(() => setLoading(false));
    }
  }, [mode, articleId, router]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        urls.push(await uploadImage(f, `articles/${Date.now()}_${f.name}`));
      }
      setImages((prev) => [...prev, ...urls]);
      toast.success('Images téléversées');
    } catch {
      toast.error('Échec du téléversement');
    } finally {
      setUploading(false);
    }
  }

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  function addVariant() {
    setVariants((prev) => [...prev, { id: `v${Date.now()}`, name: '', type: 'size', stock: 1 }]);
  }

  function updateVariant(id: string, patch: Partial<Variant>) {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function removeVariant(id: string) {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.price <= 0) {
      toast.error('Titre et prix valide requis');
      return;
    }
    if (images.length === 0) {
      toast.error('Ajoutez au moins une image');
      return;
    }
    setIsSaving(true);
    try {
      const totalStock = hasVariants ? variants.reduce((s, v) => s + (v.stock ?? 0), 0) : formData.stock;
      const payload = {
        title: formData.title.trim(),
        description: formData.description,
        price: Number(formData.price),
        oldPrice: Number(formData.oldPrice) || undefined,
        originalPrice: Number(formData.oldPrice) || undefined,
        category: Number(formData.category),
        brand: formData.brand.trim() || undefined,
        collection: formData.collection.trim() || undefined,
        thumbnail: images[0],
        screenshots: images.slice(1),
        hasVariants,
        variants: hasVariants ? variants : [],
        totalStock,
        active: formData.active,
        seoTitle: formData.seoTitle.trim() || undefined,
        seoDescription: formData.seoDescription.trim() || undefined,
      };
      if (mode === 'edit' && articleId) {
        await updateArticle(articleId, payload);
        if (totalStock !== origStock) {
          await logInventory(articleId, totalStock - origStock, 'manual_edit');
        }
        toast.success('Article mis à jour');
      } else {
        await createArticle({ ...payload, rating: 0, ratingsCount: 0, salesCount: 0 } as Omit<Article, 'id'>);
        toast.success('Article créé');
      }
      router.push('/dashboard/articles');
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse max-w-4xl" />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Main Info */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Informations générales</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l&apos;article</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix (DZD)</label>
            <input
              type="number"
              required
              min={1}
              value={formData.price}
              onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ancien prix (DZD)</label>
            <input
              type="number"
              min={0}
              value={formData.oldPrice}
              onChange={e => setFormData({...formData, oldPrice: parseFloat(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
          {!hasVariants && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                required
                min={0}
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="rounded text-indigo-600" /> Visible en boutique
        </label>
      </div>

      {/* Organization */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Organisation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white">
              {categories.map((c, i) => (
                <option key={i} value={i}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marque (Brand)</label>
            <input
              type="text"
              value={formData.brand}
              onChange={e => setFormData({...formData, brand: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
            <input
              type="text"
              value={formData.collection}
              onChange={e => setFormData({...formData, collection: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="Ex: Été 2026"
            />
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <h2 className="text-lg font-bold text-gray-900">Variantes</h2>
          <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)}
            className="rounded text-indigo-600 w-5 h-5" />
        </label>
        {hasVariants && (
          <div className="space-y-3">
            {variants.map((v) => (
              <div key={v.id} className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-xl">
                <input value={v.name} onChange={(e) => updateVariant(v.id, { name: e.target.value })}
                  placeholder="Nom (ex: Rouge / M)" className="flex-1 min-w-[140px] border rounded-lg px-2 py-1.5 text-sm" />
                <select value={v.type} onChange={(e) => updateVariant(v.id, { type: e.target.value })}
                  className="border rounded-lg px-2 py-1.5 text-sm bg-white">
                  <option value="size">Taille</option>
                  <option value="color">Couleur</option>
                  <option value="material">Matière</option>
                </select>
                {v.type === 'color' && (
                  <input type="color" value={v.color || '#000000'} onChange={(e) => updateVariant(v.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer" />
                )}
                <label className="text-sm flex items-center gap-1">Stock
                  <input type="number" min={0} value={v.stock ?? 0} onChange={(e) => updateVariant(v.id, { stock: Number(e.target.value) || 0 })}
                    className="w-20 border rounded-lg px-2 py-1.5 text-sm" />
                </label>
                <button type="button" onClick={() => removeVariant(v.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addVariant} className="flex items-center gap-2 text-indigo-600 text-sm font-medium hover:underline">
              <Plus size={16} /> Ajouter une variante
            </button>
          </div>
        )}
      </div>

      {/* Media */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Images</h2>
        <div className="flex flex-wrap gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X size={12} />
              </button>
              {idx === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-indigo-600 text-white px-1.5 rounded">Principale</span>}
            </div>
          ))}
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-600 cursor-pointer transition-colors">
            {uploading ? <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={24} />}
            <span className="text-xs mt-1">Ajouter</span>
            <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Référencement (SEO)</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre SEO</label>
          <input
            type="text"
            value={formData.seoTitle}
            onChange={e => setFormData({...formData, seoTitle: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="Titre pour les moteurs de recherche"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description SEO</label>
          <textarea
            rows={2}
            value={formData.seoDescription}
            onChange={e => setFormData({...formData, seoDescription: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="Description meta pour les moteurs de recherche"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pb-12">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSaving || uploading}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <><Save size={20} /> Enregistrer</>
          )}
        </button>
      </div>
    </form>
  );
}
