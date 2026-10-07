'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CartIcon from '../cart/cart-icon';
import CartDrawer from '../cart/cart-drawer';

export default function Header() {
  const { currentUser } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/articles?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link href="/" className="text-2xl font-bold text-indigo-600 tracking-tight">
            Ma Boutique
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
            Accueil
          </Link>
          <Link href="/articles" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
            Boutique
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent border-none outline-none text-sm w-32 md:w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="text-gray-500 hover:text-indigo-600">
                <Search size={18} />
              </button>
              <button type="button" onClick={() => setIsSearchOpen(false)} className="ml-2 text-gray-400">
                <X size={16} />
              </button>
            </form>
          ) : (
            <button onClick={() => setIsSearchOpen(true)} className="text-gray-700 hover:text-indigo-600 p-2">
              <Search size={24} />
            </button>
          )}

          <Link href={currentUser ? '/account' : '/login'} className="text-gray-700 hover:text-indigo-600 p-2">
            <User size={24} />
          </Link>

          <button onClick={() => setIsCartDrawerOpen(true)} className="text-gray-700 hover:text-indigo-600 p-2">
            <CartIcon />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 p-4 shadow-lg flex flex-col gap-4">
          <Link
            href="/"
            className="text-gray-700 font-medium p-2 rounded-lg hover:bg-gray-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Accueil
          </Link>
          <Link
            href="/articles"
            className="text-gray-700 font-medium p-2 rounded-lg hover:bg-gray-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Boutique
          </Link>
        </div>
      )}

      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
    </header>
  );
}
