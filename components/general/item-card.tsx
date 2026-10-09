'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Article } from '@/interfaces/article';

interface ItemCardProps {
  article: Article;
}

export default function ItemCard({ article }: ItemCardProps) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isLiked = isInWishlist(article.id);
  const discount = article.oldPrice ? Math.round(((article.oldPrice - article.price) / article.oldPrice) * 100) : 0;
  const stock = article.totalStock ?? 1;
  const rating = article.rating ?? 0;
  const ratingsCount = article.ratingsCount ?? 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (article.hasVariants) {
      return; // go to detail page to pick a variant
    }
    if (stock <= 0) return;
    addItem({
      articleId: article.id,
      title: article.title,
      price: article.price,
      thumbnail: article.thumbnail,
      quantity: 1,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(article.id);
  };

  return (
    <Link href={`/articles/${article.id}`} className="group block h-full">
      <div className="bg-white rounded-2xl hover:shadow-lg transition-all duration-300 border border-line h-full flex flex-col overflow-hidden relative">

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-2">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
              -{discount}%
            </span>
          )}
          {stock === 0 ? (
            <span className="bg-ink text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
              Rupture
            </span>
          ) : stock < 10 ? (
            <span className="bg-stock text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
              Stock limité
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm"
        >
          <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : ""} />
        </button>

        {/* Image */}
        <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
          <Image
            src={article.thumbnail || '/placeholder.png'}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-ink line-clamp-1 mb-1 group-hover:text-blueprint transition-colors">
            {article.title}
          </h3>
          {ratingsCount > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-slate2">{rating.toFixed(1)} ({ratingsCount})</span>
            </div>
          )}

          <div className="mt-auto flex items-end justify-between">
            <div>
              <span className="text-lg font-bold text-blueprint">
                {article.price.toLocaleString('fr-DZ')} DA
              </span>
              {article.oldPrice && (
                <span className="text-xs text-slate2 line-through block">
                  {article.oldPrice.toLocaleString('fr-DZ')} DA
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              aria-label="Ajouter au panier"
              className={`p-2.5 rounded-xl shadow-sm transition-all ${
                stock === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blueprint-light text-blueprint hover:bg-blueprint hover:text-white'
              }`}
            >
              <ShoppingBag size={20} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
