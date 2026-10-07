'use client';

import { useState } from 'react';
import { X, MapPin, Phone, User, Package, Clock, MessageSquare, Save } from 'lucide-react';

interface AmplifyItem {
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface AmplifyNote {
  date: string;
  note: string;
  author: string;
}

interface AmplifyOrder {
  id: string;
  date: string;
  status: string;
  customer: { name: string; phone: string; address: string; commune: string; wilaya: string };
  deliveryMethod: string;
  items: AmplifyItem[];
  trackingNotes?: AmplifyNote[];
  subtotal: number;
  shippingCost: number;
  discount?: { code: string; amount: number };
  total: number;
}

interface CommandAmplifyProps {
  order: AmplifyOrder;
  onClose: () => void;
}

export default function CommandAmplify({ order, onClose }: CommandAmplifyProps) {
  const [status, setStatus] = useState(order.status);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<AmplifyNote[]>(order.trackingNotes || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      if (newNote.trim()) {
        const noteEntry = {
          date: new Date().toLocaleString('fr-FR'),
          note: newNote,
          author: 'Admin'
        };
        setNotes([noteEntry, ...notes]);
        setNewNote('');
      }
      // Update order status logic would go here
      setIsSaving(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Commande {order.id}</h2>
            <p className="text-sm text-gray-500 mt-1">{order.date}</p>
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
                      <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="text-gray-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <MapPin className="text-gray-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customer.address}</p>
                      <p className="text-sm text-gray-500">{order.customer.commune}, {order.customer.wilaya}</p>
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
                  {order.items.map((item: AmplifyItem) => (
                    <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Package size={24} className="text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.variant}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{item.price} DZD</p>
                        <p className="text-sm text-gray-500">Qté: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Actions & Timeline */}
            <div className="space-y-6">
              
              {/* Status Update & Notes */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Mise à jour</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut de la commande</label>
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    >
                      <option value="pending">En attente</option>
                      <option value="processing">En traitement</option>
                      <option value="shipped">Expédiée</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
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
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <><Save size={16} /> Enregistrer</>
                    )}
                  </button>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Résumé financier</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total</span>
                    <span>{order.subtotal} DZD</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Livraison</span>
                    <span>{order.shippingCost} DZD</span>
                  </div>
                  {order.discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Remise ({order.discount.code})</span>
                      <span>-{order.discount.amount} DZD</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span>{order.total} DZD</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Historique</h3>
                <div className="space-y-4">
                  {notes.map((note: AmplifyNote, idx: number) => (
                    <div key={idx} className="flex gap-3 relative">
                      {idx !== notes.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-16px] w-0.5 bg-gray-100"></div>
                      )}
                      <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border-2 border-white z-10 relative">
                        {idx === notes.length - 1 ? <Clock size={12} /> : <MessageSquare size={12} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{note.note}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{note.date} par {note.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
