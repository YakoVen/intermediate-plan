'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function CartIcon() {
  const { itemCount } = useCart();

  return (
    <div className="relative inline-flex items-center justify-center">
      <ShoppingCart size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </div>
  );
}
