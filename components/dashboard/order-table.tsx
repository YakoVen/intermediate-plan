'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Eye, Download, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import CommandAmplify from './command-amplify';
import { Order } from '@/interfaces/order';
import { getOrders } from '@/service/firebase/database';
import { getStatusLabel } from '@/service/shipping/status-map';
import toast from 'react-hot-toast';

const stateLabels = ['En attente', 'Confirmée', 'Expédiée', 'Livrée'];
const stateColors = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
];
const PAGE_SIZE = 10;

export default function OrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setOrders(await getOrders());
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !q ||
        order.id.toLowerCase().includes(q) ||
        order.name.toLowerCase().includes(q) ||
        order.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        (order.trackingNumber ?? '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || order.state === Number(statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const pageCount = Math.max(Math.ceil(filteredOrders.length / PAGE_SIZE), 1);
  const safePage = Math.min(page, pageCount - 1);
  const pageOrders = filteredOrders.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function handleUpdated(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelectedOrder(updated);
  }

  const exportCSV = () => {
    const headers = ['ID', 'Client', 'Téléphone', 'Wilaya', 'Date', 'Statut', 'Suivi', 'Transporteur', 'Total'];
    const rows = filteredOrders.map((o) => [
      o.id, `"${o.name}"`, o.phone, o.wilaya, o.date, stateLabels[o.state] ?? o.state,
      o.trackingNumber ?? '', o.courier ?? '', o.total,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'commandes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Controls */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher (ID, nom, tel)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <option value="all">Tous les statuts</option>
              {stateLabels.map((label, i) => (
                <option key={i} value={i}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm">
              <th className="p-4 font-medium">Commande</th>
              <th className="p-4 font-medium">Client</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Statut</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageOrders.length > 0 ? (
              pageOrders.map((order) => (
                <tr key={order.id} className="text-sm hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">
                    #{order.id.substring(0, 8)}
                    {order.trackingNumber && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 font-mono mt-0.5" title={order.courierStatus ? getStatusLabel(order.courierStatus).fr : undefined}>
                        <Truck size={12} className="shrink-0" />
                        {order.trackingNumber}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-gray-900 font-medium">{order.name}</div>
                    <div className="text-gray-500 text-xs">{order.phone}</div>
                    <div className="text-gray-500 text-xs">{order.wilaya}</div>
                  </td>
                  <td className="p-4 text-gray-600">{order.date ? order.date.slice(0, 10) : ''}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${stateColors[order.state] ?? 'bg-gray-100 text-gray-600'}`}>
                      {stateLabels[order.state] ?? order.state}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{order.total.toLocaleString()} DZD</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors inline-flex"
                      title="Voir les détails"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Aucune commande trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white text-sm">
        <span className="text-gray-500">
          {filteredOrders.length === 0 ? '0 commande' : `Affichage de ${safePage * PAGE_SIZE + 1} à ${Math.min(safePage * PAGE_SIZE + PAGE_SIZE, filteredOrders.length)} sur ${filteredOrders.length} commandes`}
        </span>
        <div className="flex gap-1">
          <button onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={safePage === 0}
            className="p-1 rounded border border-gray-300 text-gray-500 disabled:opacity-50"><ChevronLeft size={16} /></button>
          <button onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))} disabled={safePage >= pageCount - 1}
            className="p-1 rounded border border-gray-300 text-gray-500 disabled:opacity-50"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <CommandAmplify order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdated={handleUpdated} />
      )}
    </div>
  );
}
