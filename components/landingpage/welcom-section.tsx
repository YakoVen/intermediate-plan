import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export default function WelcomeSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-white rounded-3xl mx-4 mt-6 md:mt-8 p-8 md:p-16 lg:p-24 shadow-sm border border-indigo-100/50">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-indigo-100/40 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-100/40 blur-3xl"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm mb-6 border border-indigo-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
          Nouvelle Collection 2026
        </span>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
          Découvrez notre <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">boutique exclusive</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed">
          Trouvez les meilleurs produits tendance avec une livraison rapide sur les 58 wilayas. La qualité et l&apos;élégance à portée de clic en Algérie.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/articles" 
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg hover:shadow-indigo-200"
          >
            <ShoppingBag size={20} className="mr-2" />
            Commencer les achats
          </Link>
          <Link 
            href="/categories" 
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-indigo-700 bg-white border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            Voir les catégories
            <ArrowRight size={20} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
