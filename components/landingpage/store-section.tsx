import React from 'react';
import { Truck, CreditCard, ShieldCheck, HeadphonesIcon } from 'lucide-react';

const features = [
  {
    icon: <Truck size={32} className="text-indigo-600" />,
    title: 'Livraison 58 Wilayas',
    description: 'Livraison rapide et sécurisée partout en Algérie.'
  },
  {
    icon: <CreditCard size={32} className="text-indigo-600" />,
    title: 'Paiement à la livraison',
    description: 'Payez en toute sécurité à la réception de votre commande.'
  },
  {
    icon: <ShieldCheck size={32} className="text-indigo-600" />,
    title: 'Garantie Qualité',
    description: 'Tous nos produits sont testés et approuvés.'
  },
  {
    icon: <HeadphonesIcon size={32} className="text-indigo-600" />,
    title: 'Support 7/7',
    description: 'Notre équipe est à votre disposition tous les jours.'
  }
];

export default function StoreSection() {
  return (
    <section className="py-12 border-y border-gray-100 bg-white my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 transform transition-transform hover:scale-110">
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
