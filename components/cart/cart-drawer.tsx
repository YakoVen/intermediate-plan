'use client';

import React from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[70] shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Mon Panier</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
              <span className="text-lg">Votre panier est vide</span>
              <button onClick={onClose} className="text-indigo-600 font-medium hover:underline">
                Continuer mes achats
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.articleId}-${item.variantId || 'base'}`} className="flex gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100 relative">
                <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0 bg-white">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">Image</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start pr-6">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{item.title}</h3>
                    <span className="font-bold text-indigo-600 whitespace-nowrap">{item.price * item.quantity} DA</span>
                  </div>
                  {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.articleId, Math.max(1, item.quantity - 1), item.variantId)}
                        className="p-1 text-gray-500 hover:text-indigo-600"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.articleId, item.quantity + 1, item.variantId)}
                        className="p-1 text-gray-500 hover:text-indigo-600"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.articleId, item.variantId)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Sous-total</span>
              <span className="text-xl font-bold text-gray-900">{subtotal} DA</span>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/cart"
                onClick={onClose}
                className="w-full py-3 px-4 text-center border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
              >
                Voir le panier
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full py-3 px-4 text-center bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Passer à la caisse
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
