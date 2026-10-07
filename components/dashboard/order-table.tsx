'use client';

import { useState } from 'react';
import { Search, Filter, Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import CommandAmplify from './command-amplify';

const mockOrders = [
  {
    id: 'ORD-001',
    customer: { name: 'Ahmed K.', phone: '0555123456', address: '123 Rue Principale', wilaya: 'Alger', commune: 'Sidi M\'Hamed' },
    date: '2023-10-01 14:30',
    status: 'pending',
    total: 12500,
    subtotal: 12000,
    shippingCost: 500,
    deliveryMethod: 'home',
    items: [
      { id: '1', name: 'T-Shirt Basique', variant: 'L - Noir', price: 2500, quantity: 2, image: '/placeholder.jpg' },
      { id: '2', name: 'Pantalon Cargo', variant: 'M - Kaki', price: 7000, quantity: 1, image: '/placeholder.jpg' }
    ],
    trackingNotes: [
      { date: '2023-10-01 14:30', note: 'Commande passée', author: 'Système' }
    ]
  },
  {
    id: 'ORD-002',
    customer: { name: 'Sarah M.', phone: '0666987654', address: '45 Cité Boussouf', wilaya: 'Constantine', commune: 'Constantine' },
    date: '2023-10-01 09:15',
    status: 'shipped',
    total: 8500,
    subtotal: 7800,
    shippingCost: 700,
    deliveryMethod: 'desk',
    items: [
      { id: '3', name: 'Robe d\'été', variant: 'M - Bleu', price: 7800, quantity: 1, image: '/placeholder.jpg' }
    ],
    trackingNotes: [
      { date: '2023-10-01 09:15', note: 'Commande passée', author: 'Système' },
      { date: '2023-10-01 16:45', note: 'Expédiée via Yalidine (Tracking: 12345)', author: 'Admin' }
    ]
  }
];

export default function OrderTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<(typeof mockOrders)[number] | null>(null);

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    // Basic CSV export logic
    const headers = ['ID', 'Client', 'Téléphone', 'Wilaya', 'Date', 'Statut', 'Total'];
    const rows = filteredOrders.map(o => [
      o.id, o.customer.name, o.customer.phone, o.customer.wilaya, o.date, o.status, o.total
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="processing">En traitement</option>
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
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
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id} className="text-sm hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{order.id}</td>
                  <td className="p-4">
                    <div className="text-gray-900 font-medium">{order.customer.name}</div>
                    <div className="text-gray-500 text-xs">{order.customer.phone}</div>
                    <div className="text-gray-500 text-xs">{order.customer.wilaya}</div>
                  </td>
                  <td className="p-4 text-gray-600">{order.date}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                      ${order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                        order.status === 'processing' ? 'bg-purple-100 text-purple-700' : 
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                        'bg-red-100 text-red-700'}
                    `}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{order.total} DZD</td>
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

      {/* Pagination (Mock) */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white text-sm">
        <span className="text-gray-500">Affichage de 1 à {filteredOrders.length} sur {filteredOrders.length} commandes</span>
        <div className="flex gap-1">
          <button className="p-1 rounded border border-gray-300 text-gray-500 disabled:opacity-50"><ChevronLeft size={16} /></button>
          <button className="p-1 rounded border border-gray-300 text-gray-500 disabled:opacity-50"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <CommandAmplify order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
