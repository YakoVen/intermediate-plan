'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, HeartCrack, ShoppingCart } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { getArticle } from '@/service/firebase/database';
import { Article } from '@/interfaces/article';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (wishlist.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }
      try {
        const results = await Promise.all(wishlist.map((id) => getArticle(id)));
        setArticles(results.filter((a): a is Article => a !== null));
      } catch {
        toast.error('Erreur de chargement de la wishlist');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [wishlist]);

  function handleAddToCart(article: Article) {
    const inStock = (article.totalStock ?? 1) > 0;
    if (!inStock) return;
    addItem({
      articleId: article.id,
      title: article.title,
      price: article.price,
      thumbnail: article.thumbnail,
      quantity: 1,
    });
    toast.success('Ajoute au panier');
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center text-center">
        <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <HeartCrack className="h-12 w-12 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre wishlist est vide</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Vous n&apos;avez pas encore ajouté d&apos;articles à votre wishlist. Explorez nos produits et enregistrez vos coups de cœur !
        </p>
        <Link
          href="/articles"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ma Wishlist</h1>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {articles.length} article{articles.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((item) => {
          const inStock = (item.totalStock ?? 1) > 0;
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="bg-gray-200 h-48 relative">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Image</div>
                )}
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="p-2 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                    title="Retirer de la wishlist"
                  >
                    <Heart className="h-5 w-5 fill-current" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2 truncate">{item.title}</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-gray-900">{item.price} DA</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {inStock ? 'En stock' : 'Rupture'}
                  </span>
                </div>

                <button
                  disabled={!inStock}
                  onClick={() => handleAddToCart(item)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Ajouter au panier
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
