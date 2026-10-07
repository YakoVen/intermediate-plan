'use client';

import { useState } from 'react';
import { Upload, X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ArticleEditorProps {
  mode: 'add' | 'edit';
  articleId?: string;
}

export default function ArticleEditor({ mode }: ArticleEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: mode === 'edit' ? 'T-Shirt Basique' : '',
    description: mode === 'edit' ? 'Un t-shirt basique.' : '',
    price: mode === 'edit' ? 2500 : 0,
    oldPrice: 0,
    category: mode === 'edit' ? 'Vêtements' : '',
    brand: '',
    collection: '',
    stock: mode === 'edit' ? 150 : 0,
    active: true,
    seoTitle: '',
    seoDescription: ''
  });

  const [images, setImages] = useState<string[]>(mode === 'edit' ? ['/placeholder.jpg'] : []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      router.push('/dashboard/articles');
    }, 1000);
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

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
              value={formData.price}
              onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ancien prix (DZD)</label>
            <input 
              type="number" 
              value={formData.oldPrice}
              onChange={e => setFormData({...formData, oldPrice: parseFloat(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input 
              type="number" 
              required
              value={formData.stock}
              onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Organisation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <input 
              type="text" 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
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
            />
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Images</h2>
        <div className="flex flex-wrap gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-24 h-24 bg-gray-100 rounded-lg border border-gray-200">
              <button 
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-600 cursor-pointer transition-colors">
            <Upload size={24} />
            <span className="text-xs mt-1">Ajouter</span>
            <input type="file" className="hidden" multiple accept="image/*" />
          </label>
        </div>
      </div>

      {/* SEO (Intermediate Plan Feature) */}
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
          disabled={isSaving}
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
