'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PackageX, ChevronRight, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOrdersByUser } from '@/service/firebase/database';
import { Order } from '@/interfaces/order';

const stateLabels = ['En attente', 'Confirmée', 'Expédiée', 'Livrée'];
const stateColors = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
];

export default function OrdersPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    getOrdersByUser(currentUser.uid)
      .then((o) => setOrders(o.filter((x) => x.type !== 'failed')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser, authLoading, router]);

  if (loading || authLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center text-center">
        <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <PackageX className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune commande</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Vous n&apos;avez pas encore passé de commande. Découvrez nos produits et commencez vos achats !
        </p>
        <Link
          href="/articles"
          className="inline-flex items-center px-6 py-3 text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mes Commandes ({orders.length})</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-indigo-200 transition-colors">
            <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="font-bold text-lg text-gray-900">#{order.id.substring(0, 8)}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stateColors[order.state] ?? 'bg-gray-100 text-gray-600'}`}>
                    {stateLabels[order.state] ?? ''}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Passée le {order.date ? order.date.slice(0, 10) : ''}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-500 mb-1">Total</p>
                <p className="font-bold text-lg text-gray-900">{order.total.toLocaleString()} DA</p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-3 overflow-hidden">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="inline-block h-12 w-12 rounded-lg border-2 border-white bg-gray-200 overflow-hidden">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-gray-400" /></div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg border-2 border-white bg-gray-100 text-xs font-medium text-gray-600">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {order.items.reduce((s, i) => s + i.quantity, 0)} article{order.items.reduce((s, i) => s + i.quantity, 0) > 1 ? 's' : ''}
                </span>
              </div>

              <Link
                href={`/account/orders/${order.id}`}
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm"
              >
                Détails
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
