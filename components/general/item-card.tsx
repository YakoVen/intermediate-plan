'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
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
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 h-full flex flex-col overflow-hidden relative">
        
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
              -{discount}%
            </span>
          )}
          {stock === 0 ? (
            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
              Rupture
            </span>
          ) : stock < 10 ? (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
              Stock Faible
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
          {article.hasVariants && (
            <span className="text-xs font-medium text-indigo-600 mb-1 inline-block">
              Plusieurs options
            </span>
          )}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
            {article.title}
          </h3>
          
          <div className="mt-auto flex items-end justify-between">
            <div>
              {article.oldPrice && (
                <span className="text-sm text-gray-400 line-through block">
                  {article.oldPrice} DA
                </span>
              )}
              <span className="text-lg font-bold text-gray-900">
                {article.price} DA
              </span>
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={stock === 0}
              className={`p-2.5 rounded-xl shadow-sm transition-all ${
                stock === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
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
