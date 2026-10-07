"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../interfaces/order';

interface CartContextProps {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  sessionId: string;
  addItem: (item: CartItem) => void;
  removeItem: (articleId: string, variantId?: string) => void;
  updateQuantity: (articleId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const savedCart = localStorage.getItem('ecom_cart');
    if (savedCart) {
      try { setItems(JSON.parse(savedCart)); } catch {}
    }
    let sid = localStorage.getItem('ecom_session_id');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('ecom_session_id', sid);
    }
    setSessionId(sid);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ecom_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(i => i.articleId === newItem.articleId && i.variantId === newItem.variantId);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += newItem.quantity;
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (articleId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => !(i.articleId === articleId && i.variantId === variantId)));
  };

  const updateQuantity = (articleId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) { removeItem(articleId, variantId); return; }
    setItems(prev => prev.map(i => i.articleId === articleId && i.variantId === variantId ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, subtotal, itemCount, sessionId, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
