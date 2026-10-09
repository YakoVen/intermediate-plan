import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export default function WelcomeSection() {
  return (
    <section className="relative overflow-hidden bg-sky rounded-3xl mx-4 mt-6 md:mt-8 p-8 md:p-12 shadow-sm border border-line">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/50 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-white/40 blur-3xl"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-sky text-blueprint font-semibold text-sm mb-5 border border-line shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blueprint mr-2 animate-pulse"></span>
          Nouvelle Collection 2026
        </span>

        <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight leading-tight mb-4">
          Découvrez notre <span className="text-blueprint">boutique exclusive</span>
        </h1>

        <p className="text-base md:text-lg text-slate2 mb-8 max-w-2xl leading-relaxed">
          Des produits de qualité, soigneusement sélectionnés avec une livraison dans les 58 wilayas d&apos;Algérie.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/articles"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-blueprint hover:bg-blueprint-dark rounded-xl transition-all shadow-lg"
          >
            <ShoppingBag size={20} className="mr-2" />
            Commencer les achats
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-blueprint bg-white border-2 border-line hover:border-blueprint rounded-xl transition-all"
          >
            Voir les catégories
            <ArrowRight size={20} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
