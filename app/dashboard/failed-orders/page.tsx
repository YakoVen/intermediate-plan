'use client';

import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { Order } from '@/interfaces/order';
import { getFailedOrders, resolveFailedOrder } from '@/service/firebase/database';
import toast from 'react-hot-toast';

export default function FailedOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setOrders(await getFailedOrders());
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id: string) {
    setResolving(id);
    try {
      await resolveFailedOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success('Commande marquée résolue');
    } catch {
      toast.error('Erreur de mise à jour');
    } finally {
      setResolving(null);
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Commandes échouées</h1>
        <span className="text-sm text-gray-500">{orders.length} en attente de traitement</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Valeur</th>
                <th className="p-4 font-medium">Raison de l&apos;échec</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="text-sm hover:bg-gray-50">
                  <td className="p-4 text-gray-600">{order.date ? order.date.slice(0, 16).replace('T', ' ') : ''}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{order.name}</div>
                    <div className="text-gray-500 text-xs">{order.phone}</div>
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    {(order.total || 0).toLocaleString()} DA<br />
                    <span className="text-xs text-gray-500 font-normal">{(order.items || []).reduce((s, i) => s + i.quantity, 0)} article(s)</span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <XCircle size={14} /> {order.failureReason || 'Erreur inconnue'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleResolve(order.id)} disabled={resolving === order.id}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-xs disabled:opacity-50">
                      {resolving === order.id ? '...' : 'Marquer résolu'}
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Aucune commande échouée récente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
