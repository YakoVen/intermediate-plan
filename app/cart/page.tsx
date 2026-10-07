'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const [items, setItems] = useState([
    { id: '1', title: 'Produit de test', price: 4500, quantity: 1, image: 'https://via.placeholder.com/150' }
  ]);

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Votre panier est vide</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Découvrez nos produits et trouvez ce qui vous correspond le mieux.
        </p>
        <Link href="/articles" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Votre panier</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <img src={item.image} alt={item.title} className="w-24 h-24 rounded-xl object-cover" />
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-indigo-600">{item.price} DA</span>
                  <div className="flex items-center bg-gray-100 rounded-xl">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-gray-200 rounded-l-xl">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-gray-200 rounded-r-xl">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-8">
            <h2 className="text-xl font-bold text-gray-900">Résumé</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{subtotal} DA</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>Calculé à l&apos;étape suivante</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span>{subtotal} DA</span>
              </div>
            </div>
            <Link href="/checkout" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium flex justify-center hover:bg-indigo-700 transition">
              Passer la commande
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
