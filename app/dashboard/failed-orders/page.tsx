'use client';

import { useState } from 'react';
import Link from 'next/link';
import { XCircle, CheckCircle, Plus } from 'lucide-react';

const mockFailedOrders = [
  { id: 'FO-001', customer: 'Karim S.', phone: '0555998877', itemsCount: 2, value: 12500, date: 'Aujourd\'hui 10:30', reason: 'Paiement refusé', status: 'pending' },
  { id: 'FO-002', customer: 'Amira T.', phone: '0666112233', itemsCount: 1, value: 4500, date: 'Hier 15:45', reason: 'Rupture de stock soudaine', status: 'pending' },
  { id: 'FO-003', customer: 'Samir L.', phone: '0777556644', itemsCount: 5, value: 34000, date: 'Il y a 3 jours', reason: 'Adresse invalide', status: 'resolved' },
];

export default function FailedOrdersPage() {
  const [toastMessage, setToastMessage] = useState('');

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
        <h1 className="text-2xl font-bold text-gray-900">Commandes échouées</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Valeur</th>
                <th className="p-4 font-medium">Raison de l&apos;échec</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockFailedOrders.length > 0 ? (
                mockFailedOrders.map((order) => (
                  <tr key={order.id} className={`text-sm hover:bg-gray-50 ${order.status === 'resolved' ? 'opacity-60' : ''}`}>
                    <td className="p-4 text-gray-600">{order.date}</td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{order.customer}</div>
                      <div className="text-gray-500 text-xs">{order.phone}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-900">{order.value} DZD<br/><span className="text-xs text-gray-500 font-normal">{order.itemsCount} article(s)</span></td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <XCircle size={14} /> {order.reason}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {order.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => showToast(`Commande ${order.id} marquée comme résolue`)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-xs transition-colors"
                          >
                            Marquer résolu
                          </button>
                          <Link 
                            href="/dashboard/orders/create"
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Plus size={14} /> Créer manuellement
                          </Link>
                        </>
                      )}
                      {order.status === 'resolved' && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">Résolu</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Aucune commande échouée récente.
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
