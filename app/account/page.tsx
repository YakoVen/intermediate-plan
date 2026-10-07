import { Package, Heart, MapPin, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AccountOverviewPage() {
  const user = { name: 'Mohamed' };
  
  const stats = [
    { name: 'Total Commandes', value: '12', icon: Package, href: '/account/orders' },
    { name: 'Total Dépensé', value: '45,000 DA', icon: CreditCard, href: '/account/orders' },
    { name: 'Articles Wishlist', value: '5', icon: Heart, href: '/account/wishlist' },
    { name: 'Adresses Enregistrées', value: '2', icon: MapPin, href: '/account/addresses' },
  ];

  const recentOrders = [
    { id: 'CMD-8492', date: '12 Oct 2023', total: '12,500 DA', status: 'Livré' },
    { id: 'CMD-8411', date: '05 Sep 2023', total: '8,900 DA', status: 'Livré' },
    { id: 'CMD-8302', date: '21 Aou 2023', total: '24,000 DA', status: 'Annulé' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bonjour, {user.name} 👋
        </h1>
        <p className="text-gray-600">
          Bienvenue sur votre tableau de bord. Ici vous pouvez vérifier vos activités récentes, mettre à jour vos informations et gérer vos commandes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link 
              key={stat.name} 
              href={stat.href}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <Icon className="h-6 w-6 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Commandes Récentes</h2>
          <Link href="/account/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
            Voir tout
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentOrders.map((order) => (
            <div key={order.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-bold text-gray-900">{order.id}</p>
                <p className="text-sm text-gray-500">{order.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{order.total}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  order.status === 'Livré' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
