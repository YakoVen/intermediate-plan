'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Minus, Plus, Share2, ShoppingCart, MessageCircle, Star } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import toast from 'react-hot-toast';
import ReviewsSection from './reviews-section';

interface VariantShape {
  id: string;
  name: string;
  stock?: number;
}

interface ArticleShape {
  id: string;
  title: string;
  price: number;
  images?: string[];
  thumbnail?: string;
  stock?: number;
  variants?: VariantShape[];
  hasVariants?: boolean;
  description?: string;
  oldPrice?: number;
  discount?: number;
  rating?: number;
  ratingsCount?: number;
}

export default function Presentation({ article, relatedArticles }: { article: ArticleShape, relatedArticles: { id: string; title: string; thumbnail?: string; price: number }[] }) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(article.images?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState('');

  const variants = article.variants ?? [];
  const hasVariants = !!article.hasVariants && variants.length > 0;
  const selected = variants.find((v: VariantShape) => v.id === selectedVariant);
  const stock = hasVariants
    ? (selected ? (selected.stock ?? 1) : Math.max(...variants.map((v: VariantShape) => v.stock ?? 1), 0))
    : (article.stock ?? 1);
  const isOOS = stock <= 0;
  const liked = isInWishlist(article.id);

  const handleAddToCart = () => {
    if (isOOS) return;
    if (hasVariants && !selected) {
      toast('Selectionnez une variante', { icon: '👆' });
      return;
    }
    addItem({
      articleId: article.id,
      title: article.title,
      price: article.price,
      thumbnail: article.images?.[0] || article.thumbnail || '',
      quantity,
      variantId: selected?.id,
      variantName: variants.find((v: VariantShape) => v.id === selectedVariant)?.name,
    });
    toast.success('Ajoute au panier !');
  };

  const handleWishlist = () => {
    toggleWishlist(article.id);
    toast.success(liked ? 'Retire des favoris' : 'Ajoute aux favoris');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié !');
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/213000000000?text=Je suis intéressé par ${article.title}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate2">
        <Link href="/" className="hover:text-blueprint">Accueil</Link>
        <span>/</span>
        <Link href="/articles" className="hover:text-blueprint">Boutique</Link>
        <span>/</span>
        <span className="text-ink font-medium truncate">{article.title}</span>
      </nav>

      {/* Product Top Section */}
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Images */}
        <div className="lg:w-1/2 space-y-4">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
            {article.discount && (
              <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                -{article.discount}%
              </span>
            )}
            <img src={selectedImage} alt={article.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {article.images?.map((img: string, i: number) => (
              <button key={i} onClick={() => setSelectedImage(img)} className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 ${selectedImage === img ? 'border-blueprint' : 'border-transparent'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="lg:w-1/2 space-y-6">
          <div className="space-y-3">
            {stock > 0 && stock <= 10 && (
              <span className="inline-block bg-stock text-white text-xs font-bold px-2.5 py-1 rounded-md">
                Stock limité
              </span>
            )}
            <h1 className="text-3xl font-bold text-ink">{article.title}</h1>
            {typeof article.rating === 'number' && (article.ratingsCount || 0) > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={16} className={n <= Math.round(article.rating!) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} />
                  ))}
                </div>
                <span className="text-sm text-slate2">({article.ratingsCount} avis)</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-blueprint">{article.price.toLocaleString('fr-DZ')} DA</span>
              {article.oldPrice && (
                <span className="text-lg text-slate2 line-through">{article.oldPrice.toLocaleString('fr-DZ')} DA</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${stock > 10 ? 'bg-green-100 text-green-700' : stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                {stock > 10 ? 'En stock' : stock > 0 ? 'Stock limité' : 'Rupture de stock'}
              </span>
            </div>
          </div>

          {article.variants && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Variantes</h3>
              <div className="flex gap-2">
                {article.variants.map((v: VariantShape) => (
                  <button key={v.id} onClick={() => setSelectedVariant(v.id)} className={`px-4 py-2 rounded-xl border-2 ${selectedVariant === v.id ? 'border-blueprint text-blueprint bg-blueprint-light' : 'border-line text-ink hover:border-slate2'}`}>
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-6">
            <div className="flex items-center bg-gray-100 rounded-xl">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-200 rounded-l-xl transition">
                <Minus className="w-5 h-5 text-gray-600" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-gray-200 rounded-r-xl transition">
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleAddToCart} disabled={isOOS}
              className="flex-1 bg-blueprint text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blueprint-dark transition disabled:opacity-50">
              <ShoppingCart className="w-5 h-5" />
              {isOOS ? 'Rupture de stock' : 'Ajouter au panier'}
            </button>
            <button className="flex-1 bg-wa text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-95 transition" onClick={handleWhatsApp}>
              <MessageCircle className="w-5 h-5" />
              Commander sur WhatsApp
            </button>
          </div>

          <div className="flex gap-4">
            <button onClick={handleWishlist}
              className="flex-1 py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 font-medium text-gray-700 hover:bg-gray-50 transition">
              <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              {liked ? 'Dans les favoris' : 'Ajouter aux favoris'}
            </button>
            <button onClick={copyLink} className="flex-1 py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 font-medium text-gray-700 hover:bg-gray-50 transition">
              <Share2 className="w-5 h-5" />
              Partager
            </button>
          </div>
          
          <div className="pt-8 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Description</h3>
            <p className="text-gray-600 leading-relaxed">{article.description}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewsSection articleId={article.id} />

      {/* Related Products */}
      {relatedArticles.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-ink">Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedArticles.map((prod) => (
              <Link key={prod.id} href={`/articles/${prod.id}`} className="group bg-white border border-line rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {prod.thumbnail ? (
                    <img src={prod.thumbnail} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate2 text-sm">Image</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-ink truncate group-hover:text-blueprint">{prod.title}</p>
                  <p className="font-bold text-blueprint mt-1">{prod.price.toLocaleString('fr-DZ')} DA</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
