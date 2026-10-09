'use client';

import { useState } from 'react';
import { X, MapPin, Phone, User, Package, Clock, MessageSquare, Save } from 'lucide-react';
import { Order, TrackingEntry } from '@/interfaces/order';
import { updateOrder, logActivity } from '@/service/firebase/database';
import ShipmentPanel from '@/components/shipping/shipment-panel';
import { getStatusLabel, isCourierStatus } from '@/service/shipping/status-map';
import toast from 'react-hot-toast';

interface CommandAmplifyProps {
  order: Order;
  onClose: () => void;
  onUpdated?: (order: Order) => void;
}

const STATES = [
  { value: 0, label: 'En attente' },
  { value: 1, label: 'Confirmée' },
  { value: 2, label: 'Expédiée' },
  { value: 3, label: 'Livrée' },
];

const stateLabel = (s: number): string => STATES.find((x) => x.value === s)?.label || `Statut ${s}`;

/**
 * Label a history entry, which may be a DzShip status string (courier-driven)
 * or a legacy 0-3 state number (manual, written before the integration).
 */
function entryLabel(status: TrackingEntry['status']): string {
  if (typeof status === 'number') return stateLabel(status);
  if (isCourierStatus(status)) return getStatusLabel(status).fr;
  return status;
}

export default function CommandAmplify({ order, onClose, onUpdated }: CommandAmplifyProps) {
  const [status, setStatus] = useState(order.state);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const history = order.trackingHistory || [];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const entries = [...history];
      if (newNote.trim()) {
        entries.push({ status, timestamp: now, note: newNote.trim() });
      } else if (status !== order.state) {
        entries.push({ status, timestamp: now, note: `Statut → ${stateLabel(status)}` });
      }
      const patch: Partial<Order> = { state: status, trackingHistory: entries };
      if (newNote.trim()) patch.trackingNote = newNote.trim();
      await updateOrder(order.id, patch);
      await logActivity('order_status', `#${order.id.substring(0, 8)} → ${stateLabel(status)}${newNote.trim() ? ` — ${newNote.trim()}` : ''}`);
      onUpdated?.({ ...order, ...patch } as Order);
      setNewNote('');
      toast.success('Commande mise à jour');
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Commande #{order.id.substring(0, 8)}</h2>
            <p className="text-sm text-gray-500 mt-1">{order.date ? order.date.slice(0, 16).replace('T', ' ') : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Details & Items */}
            <div className="lg:col-span-2 space-y-6">

              {/* Customer Info */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Informations Client</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="text-gray-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.name}</p>
                      {order.email && <p className="text-sm text-gray-500">{order.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="text-gray-400 mt-0.5" size={18} />
                    <div>
                      <a href={`tel:${order.phone}`} className="text-sm font-medium text-indigo-600 hover:underline">{order.phone}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <MapPin className="text-gray-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.address || '—'}</p>
                      <p className="text-sm text-gray-500">{order.commune}, {order.wilaya}</p>
                      <p className="text-xs text-indigo-600 font-medium mt-1 uppercase bg-indigo-50 inline-block px-2 py-0.5 rounded">
                        Livraison: {order.deliveryMethod === 'home' ? 'À domicile' : 'Point relais'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Articles ({order.items.length})</h3>
                <div className="space-y-4">
                  {order.items.map((item, i) => (
                    <div key={`${item.articleId}-${item.variantId || i}`} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.title}</p>
                        {item.variantName && <p className="text-sm text-gray-500">{item.variantName}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{(item.price * item.quantity).toLocaleString()} DZD</p>
                        <p className="text-sm text-gray-500">Qté: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-sm space-y-2">
                <div className="flex justify-between text-gray-600"><span>Sous-total</span><span>{order.subtotal.toLocaleString()} DZD</span></div>
                <div className="flex justify-between text-gray-600"><span>Livraison</span><span>{order.deliveryFee.toLocaleString()} DZD</span></div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Remise{order.couponCode ? ` (${order.couponCode})` : ''}</span><span>-{order.discount.toLocaleString()} DZD</span></div>
                )}
                {(order.loyaltyDiscount || 0) > 0 && (
                  <div className="flex justify-between text-amber-700"><span>Points fidélité</span><span>-{(order.loyaltyDiscount || 0).toLocaleString()} DZD</span></div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>{order.total.toLocaleString()} DZD</span></div>
              </div>

            </div>

            {/* Right Column: Actions & Timeline */}
            <div className="space-y-6">

              {/* Courier: confirm then ship */}
              <ShipmentPanel order={order} onUpdated={onUpdated} />

              {/* Status Update & Notes */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Mise à jour</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut de la commande</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white"
                    >
                      {STATES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ajouter une note de suivi</label>
                    <textarea
                      rows={3}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Ex: Expédié via Yalidine. Code: 1234..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
                  >
                    <Save size={16} /> {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Historique</h3>
                <div className="space-y-4">
                  {history.length > 0 ? history.map((note, idx) => (
                    <div key={idx} className="flex gap-3 relative">
                      {idx !== history.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-16px] w-0.5 bg-gray-100"></div>
                      )}
                      <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border-2 border-white z-10 relative">
                        {idx === history.length - 1 ? <Clock size={12} /> : <MessageSquare size={12} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{note.note || entryLabel(note.status)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{note.timestamp ? note.timestamp.slice(0, 16).replace('T', ' ') : ''}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">Aucun historique.</p>
                  )}
                  {order.trackingNote && (
                    <p className="text-xs text-gray-500 pt-2 border-t">Note : {order.trackingNote}</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
