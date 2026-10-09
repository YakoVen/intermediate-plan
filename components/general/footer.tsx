import React from 'react';
import Link from 'next/link';
import { Globe, AtSign, Share2, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-line mt-12 pt-12 pb-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-1">
          <Link href="/" className="text-2xl font-bold text-ink tracking-tight mb-4 inline-block">
            Ma Boutique
          </Link>
          <p className="text-slate2 mb-6">
            Votre destination e-commerce préférée en Algérie. Découvrez les meilleures offres et des produits de qualité.
          </p>
          <div className="flex gap-4 text-slate2">
            <a href="#" className="hover:text-blueprint transition-colors" title="Facebook"><Globe size={24} /></a>
            <a href="#" className="hover:text-blueprint transition-colors" title="Instagram"><AtSign size={24} /></a>
            <a href="#" className="hover:text-blueprint transition-colors" title="Partager"><Share2 size={24} /></a>
          </div>
        </div>

        <div className="col-span-1">
          <h3 className="font-semibold text-ink mb-4 uppercase tracking-wider text-sm">Liens Rapides</h3>
          <ul className="flex flex-col gap-3">
            <li><Link href="/" className="text-slate2 hover:text-blueprint transition-colors">Accueil</Link></li>
            <li><Link href="/articles" className="text-slate2 hover:text-blueprint transition-colors">Boutique</Link></li>
            <li><Link href="/account" className="text-slate2 hover:text-blueprint transition-colors">Mon compte</Link></li>
          </ul>
        </div>

        <div className="col-span-1">
          <h3 className="font-semibold text-ink mb-4 uppercase tracking-wider text-sm">Informations</h3>
          <ul className="flex flex-col gap-3">
            <li><Link href="/about" className="text-slate2 hover:text-blueprint transition-colors">À propos</Link></li>
            <li><Link href="/contact" className="text-slate2 hover:text-blueprint transition-colors">Contact</Link></li>
            <li><Link href="/faq" className="text-slate2 hover:text-blueprint transition-colors">FAQ</Link></li>
          </ul>
        </div>

        <div className="col-span-1">
          <h3 className="font-semibold text-ink mb-4 uppercase tracking-wider text-sm">Contact</h3>
          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-3 text-slate2">
              <MapPin size={20} className="text-blueprint flex-shrink-0" />
              <span>123 Rue Principale, Alger, Algérie</span>
            </li>
            <li className="flex items-center gap-3 text-slate2">
              <Phone size={20} className="text-blueprint flex-shrink-0" />
              <span>+213 555 123 456</span>
            </li>
            <li className="flex items-center gap-3 text-slate2">
              <Mail size={20} className="text-blueprint flex-shrink-0" />
              <span>contact@maboutique.dz</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-line text-center text-slate2 text-sm">
        &copy; {new Date().getFullYear()} Ma Boutique. Tous droits réservés.
      </div>
    </footer>
  );
}
