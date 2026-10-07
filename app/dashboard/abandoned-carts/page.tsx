'use client';

import { useState } from 'react';
import { AlertTriangle, Phone, Filter, CheckCircle } from 'lucide-react';

const mockAbandonedCarts = [
  { id: 'CART-001', customer: 'Lamine D.', phone: '0555112233', itemsCount: 3, value: 14500, date: 'Il y a 2 heures', status: 'active' },
  { id: 'CART-002', customer: 'Rania B.', phone: '0666445566', itemsCount: 1, value: 3500, date: 'Il y a 5 heures', status: 'active' },
  { id: 'CART-003', customer: 'Yassine M.', phone: '0777998877', itemsCount: 2, value: 8900, date: 'Hier', status: 'recovered' },
  { id: 'CART-004', customer: 'Client Anonyme', phone: 'Non fourni', itemsCount: 4, value: 21000, date: 'Hier', status: 'resolved' },
];

export default function AbandonedCartsPage() {
  const [filter, setFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  const filteredCarts = mockAbandonedCarts.filter(cart => filter === 'all' || cart.status === filter);

  const stats = {
    total: mockAbandonedCarts.length,
    value: mockAbandonedCarts.reduce((acc, curr) => acc + curr.value, 0)
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Paniers abandonnés</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total paniers abandonnés</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Valeur totale potentielle</p>
            <p className="text-2xl font-bold text-gray-900">{stats.value.toLocaleString()} DZD</p>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif (Non contacté)</option>
              <option value="recovered">Récupéré (Acheté)</option>
              <option value="resolved">Résolu / Perdu</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="p-4 font-medium">Client / Date</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Articles</th>
                <th className="p-4 font-medium">Valeur</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCarts.length > 0 ? (
                filteredCarts.map((cart) => (
                  <tr key={cart.id} className="text-sm hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{cart.customer}</div>
                      <div className="text-gray-500 text-xs">{cart.date}</div>
                    </td>
                    <td className="p-4 text-gray-600">{cart.phone}</td>
                    <td className="p-4 text-gray-600">{cart.itemsCount} article(s)</td>
                    <td className="p-4 font-medium text-gray-900">{cart.value} DZD</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                        ${cart.status === 'active' ? 'bg-yellow-100 text-yellow-700' : 
                          cart.status === 'recovered' ? 'bg-green-100 text-green-700' : 
                          'bg-gray-100 text-gray-700'}
                      `}>
                        {cart.status === 'active' ? 'À relancer' : cart.status === 'recovered' ? 'Récupéré' : 'Résolu'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {cart.status === 'active' && cart.phone !== 'Non fourni' && (
                        <button 
                          onClick={() => showToast(`SMS de relance envoyé à ${cart.phone}`)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Phone size={14} /> SMS
                        </button>
                      )}
                      {cart.status === 'active' && (
                        <button 
                          onClick={() => showToast(`Panier ${cart.id} marqué comme résolu`)}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-xs transition-colors"
                        >
                          Marquer résolu
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Aucun panier abandonné trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
