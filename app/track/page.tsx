'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package, CheckCircle2, Truck, Home } from 'lucide-react';
import { getOrderById } from '@/service/firebase/database';
import { CartItem } from '@/interfaces/order';

const steps = [
  { id: 'pending', label: 'En attente', icon: Package },
  { id: 'confirmed', label: 'Confirmée', icon: CheckCircle2 },
  { id: 'shipped', label: 'Expédiée', icon: Truck },
  { id: 'delivered', label: 'Livrée', icon: Home },
];

const stateToStatus = ['pending', 'confirmed', 'shipped', 'delivered'];

interface TrackingData {
  id: string;
  status: string;
  total: number;
  wilaya: string;
  deliveryMethod: string;
  history: { date: string; note: string }[];
  items: CartItem[];
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 max-w-3xl"><div className="h-32 bg-gray-100 rounded-2xl animate-pulse" /></div>}>
      <TrackContent />
    </Suspense>
  );
}

function TrackContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [orderId, setOrderId] = useState(initialId);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialId) handleTrack();
  }, [initialId]);

  const handleTrack = async () => {
    if (!orderId.trim() || loading) return;
    setLoading(true);
    setError(false);
    try {
      const order = await getOrderById(orderId.trim());
      if (!order) {
        setTrackingData(null);
        setError(true);
        return;
      }
      const status = stateToStatus[order.state] ?? 'pending';
      setTrackingData({
        id: order.id,
        status,
        total: order.total,
        wilaya: order.wilaya,
        deliveryMethod: order.deliveryMethod,
        history: (order.trackingHistory ?? []).map((h) => ({ date: h.timestamp, note: h.note ?? '' })),
        items: order.items,
      });
    } catch {
      setTrackingData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    return steps.findIndex(s => s.id === status);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Suivre ma commande</h1>
        <p className="text-gray-500">Entrez votre numéro de commande pour suivre l&apos;état de la livraison.</p>
        
        <div className="max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Ex: ORDER123" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>
          <button 
            onClick={handleTrack}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Recherche...' : 'Suivre'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
          Commande introuvable. Veuillez vérifier le numéro.
        </div>
      )}

      {trackingData && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Commande #{trackingData.id}</h2>
                <p className="text-sm text-gray-500">Total: {trackingData.total} DA</p>
              </div>
            </div>

            {/* Pipeline */}
            <div className="relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${(getStepIndex(trackingData.status) / (steps.length - 1)) * 100}%` }}
              ></div>
              
              <div className="relative flex justify-between">
                {steps.map((step, index) => {
                  const isActive = getStepIndex(trackingData.status) === index;
                  const isPast = getStepIndex(trackingData.status) > index;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-colors ${
                        isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' :
                        isPast ? 'bg-indigo-600 text-white' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className={`mt-3 text-sm font-medium ${isActive || isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900">Historique</h3>
              <div className="space-y-4">
                {trackingData.history.map((h, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-600 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{h.note}</p>
                      <p className="text-xs text-gray-500">{h.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900">Détails de livraison</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium text-gray-900">Wilaya:</span> {trackingData.wilaya}</p>
                <p><span className="font-medium text-gray-900">Mode:</span> {trackingData.deliveryMethod === 'home' ? 'À domicile' : 'Point relais'}</p>
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-2">Articles</h4>
                  {trackingData.items.map((item, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.quantity}x {item.title}</span>
                      <span>{item.price} DA</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
