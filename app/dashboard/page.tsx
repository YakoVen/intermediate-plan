'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Package,
  DollarSign,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Tag,
  TrendingUp
} from 'lucide-react';
import { getOrders, getArticles, getAbandonedCarts, getFailedOrders } from '@/service/firebase/database';
import { Order } from '@/interfaces/order';
import { salesOrders, totalRevenue, statusCounts } from '@/service/analytics';
import toast from 'react-hot-toast';

const stateLabels = ['En attente', 'Confirmée', 'Expédiée', 'Livrée'];
const stateColors = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
];

export default function DashboardOverview() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeItems, setActiveItems] = useState(0);
  const [abandonedCount, setAbandonedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [o, a, c, f] = await Promise.all([
          getOrders(),
          getArticles({ active: true }),
          getAbandonedCarts(),
          getFailedOrders(),
        ]);
        setOrders(o);
        setActiveItems(a.length);
        setAbandonedCount(c.filter((x) => x.status === 'active').length);
        setFailedCount(f.length);
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sales = salesOrders(orders);
  const revenue = totalRevenue(orders);
  const statuses = statusCounts(orders);
  const recent = [...sales].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

  const statCards = [
    { name: 'Revenus (DZD)', value: revenue.toLocaleString(), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Commandes totales', value: sales.length, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'En attente', value: statuses.pending, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Articles actifs', value: activeItems, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Paniers abandonnés', value: abandonedCount, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { name: 'Commandes échouées', value: failedCount, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <Link href="/dashboard/analytics" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <TrendingUp size={16} /> Analytique
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Commandes récentes</h2>
            <Link href="/dashboard/orders" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              Voir tout <ArrowRight size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.map((order) => (
                  <tr key={order.id} className="text-sm hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">#{order.id.substring(0, 8)}</td>
                    <td className="p-4 text-gray-600">{order.name}</td>
                    <td className="p-4 text-gray-600">{order.date ? order.date.slice(0, 10) : '—'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${stateColors[order.state] ?? 'bg-gray-100 text-gray-600'}`}>
                        {stateLabels[order.state] ?? order.state}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900">{order.total.toLocaleString()} DA</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">Aucune commande pour le moment.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <Link href="/dashboard/articles/add" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-indigo-50 rounded text-indigo-600"><Package size={20} /></div>
              <div className="font-medium text-gray-700">Ajouter un article</div>
            </Link>
            <Link href="/dashboard/discounts" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-indigo-50 rounded text-indigo-600"><Tag size={20} /></div>
              <div className="font-medium text-gray-700">Créer une remise</div>
            </Link>
            <Link href="/dashboard/abandoned-carts" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-yellow-50 rounded text-yellow-600"><AlertTriangle size={20} /></div>
              <div className="font-medium text-gray-700">Voir les paniers abandonnés</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
