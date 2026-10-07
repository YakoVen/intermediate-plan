'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PackageX, ChevronRight, Package } from 'lucide-react';

// Mock data
const mockOrders = [
  {
    id: 'CMD-8492',
    date: '12 Oct 2023',
    total: 12500,
    status: 'Livré',
    statusColor: 'bg-green-100 text-green-800',
    itemCount: 3,
    images: ['/images/product1.jpg', '/images/product2.jpg', '/images/product3.jpg']
  },
  {
    id: 'CMD-8411',
    date: '05 Sep 2023',
    total: 8900,
    status: 'En cours',
    statusColor: 'bg-yellow-100 text-yellow-800',
    itemCount: 1,
    images: ['/images/product4.jpg']
  }
];

interface OrderRow {
  id: string;
  date: string;
  total: number;
  status: string;
  statusColor: string;
  itemCount: number;
  images: string[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching from /api/account/orders
    const fetchOrders = async () => {
      setTimeout(() => {
        setOrders(mockOrders);
        setLoading(false);
      }, 800);
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
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
          href="/boutique" 
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mes Commandes</h1>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-indigo-200 transition-colors">
            <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="font-bold text-lg text-gray-900">{order.id}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.statusColor}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Passée le {order.date}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-500 mb-1">Total</p>
                <p className="font-bold text-lg text-gray-900">{order.total} DA</p>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-3 overflow-hidden">
                  {order.images.slice(0, 3).map((img: string, idx: number) => (
                    <div key={idx} className="inline-block h-12 w-12 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  ))}
                  {order.itemCount > 3 && (
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg border-2 border-white bg-gray-100 text-xs font-medium text-gray-600">
                      +{order.itemCount - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {order.itemCount} article{order.itemCount > 1 ? 's' : ''}
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
