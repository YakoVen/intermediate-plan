'use client';

import { useEffect, useState } from 'react';
import {
  Truck,
  PackageCheck,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Order } from '@/interfaces/order';
import { confirmOrder } from '@/service/shipping/shipments';
import { getStatusLabel } from '@/service/shipping/status-map';
import type { CourierInfo } from '@/interfaces/shipment';
import toast from 'react-hot-toast';

/**
 * Courier panel in the order detail modal.
 *
 * Enforces the two-phase flow: confirm by phone first, then create the parcel.
 * Checkout deliberately does NOT ship (docs/cash-on-delivery.md) — an order
 * shipped to an unconfirmed customer mostly comes back, and the merchant pays
 * the return fee for the lesson.
 */

interface ShipmentPanelProps {
  order: Order;
  onUpdated?: (order: Order) => void;
}

export default function ShipmentPanel({ order, onUpdated }: ShipmentPanelProps) {
  const [couriers, setCouriers] = useState<CourierInfo[]>([]);
  const [courier, setCourier] = useState(order.courier || '');
  const [busy, setBusy] = useState<'confirm' | 'ship' | 'track' | null>(null);
  const [trackError, setTrackError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/shipping/couriers')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const list: CourierInfo[] = (data.couriers ?? []).filter((c: CourierInfo) => c.configured);
        setCouriers(list);
        if (!courier && data.defaultCourier) setCourier(data.defaultCourier);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async () => {
    setBusy('confirm');
    try {
      await confirmOrder(order.id);
      const { getOrderById } = await import('@/service/firebase/database');
      const updated = await getOrderById(order.id);
      if (updated) onUpdated?.(updated);
      toast.success('Commande confirmée — elle peut maintenant être expédiée.');
    } catch {
      toast.error('Échec de la confirmation');
    } finally {
      setBusy(null);
    }
  };

  const handleShip = async () => {
    if (!courier) {
      toast.error('Choisissez un transporteur');
      return;
    }
    setBusy('ship');
    try {
      const res = await fetch('/api/shipping/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, courier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec de création du colis');
      // Re-read the order so the modal shows the parcel immediately.
      const { getOrderById } = await import('@/service/firebase/database');
      const updated = await getOrderById(order.id);
      if (updated) onUpdated?.(updated);
      toast.success(`Colis créé : ${data.trackingNumber}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de création du colis');
    } finally {
      setBusy(null);
    }
  };

  const handleTrack = async () => {
    setBusy('track');
    setTrackError('');
    try {
      const res = await fetch('/api/shipping/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Suivi indisponible');
      const { getOrderById } = await import('@/service/firebase/database');
      const updated = await getOrderById(order.id);
      if (updated) onUpdated?.(updated);
      toast.success('Suivi actualisé');
    } catch (err) {
      setTrackError(err instanceof Error ? err.message : 'Suivi indisponible');
    } finally {
      setBusy(null);
    }
  };

  const shipped = !!order.trackingNumber;
  const confirmed = !!order.confirmedAt;
  const courierLabel = order.courierStatus ? getStatusLabel(order.courierStatus).fr : null;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Truck size={16} /> Expédition
      </h3>

      <div className="space-y-4">
        {/* 1. Confirmation gate */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium text-gray-900">Confirmation</p>
            <p className="text-xs text-gray-500">
              {confirmed
                ? `Confirmée le ${order.confirmedAt?.slice(0, 16).replace('T', ' ')}`
                : 'Confirmez par téléphone avant d’expédier.'}
            </p>
          </div>
          {!confirmed ? (
            <button
              onClick={handleConfirm}
              disabled={busy !== null}
              className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1"
            >
              {busy === 'confirm' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Confirmer
            </button>
          ) : (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">Confirmée</span>
          )}
        </div>

        {/* 2. Parcel */}
        {!shipped ? (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transporteur</label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                disabled={!confirmed || busy !== null}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-600 disabled:bg-gray-50"
              >
                <option value="">Choisir...</option>
                {couriers.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                    {c.isSandbox ? ' (test)' : ''}
                  </option>
                ))}
              </select>
              {couriers.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">Aucun transporteur configuré. Vérifiez les variables d’environnement.</p>
              )}
            </div>
            <button
              onClick={handleShip}
              disabled={!confirmed || !courier || busy !== null}
              title={!confirmed ? 'Confirmez la commande d’abord' : undefined}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {busy === 'ship' ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}
              Créer le colis
            </button>
            {!confirmed && (
              <p className="text-xs text-amber-700">La création du colis exige une commande confirmée.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-3 border-t border-gray-100 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">N° de suivi</span>
              <span className="font-medium text-gray-900 font-mono">{order.trackingNumber}</span>
            </div>
            {courierLabel && (
              <div className="flex justify-between">
                <span className="text-gray-500">Statut transporteur</span>
                <span className="font-medium text-gray-900">{courierLabel}</span>
              </div>
            )}
            {order.courier && (
              <div className="flex justify-between">
                <span className="text-gray-500">Transporteur</span>
                <span className="font-medium text-gray-900">{order.courier}</span>
              </div>
            )}
            {order.labelUrl && (
              <a
                href={order.labelUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-600 hover:underline text-sm"
              >
                <ExternalLink size={14} /> Imprimer l’étiquette
              </a>
            )}
            {order.courierStatus === 'delivery_attempted' && (
              <p className="text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-lg flex items-start gap-1">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                Tentative de livraison — appelez le client dans l’heure ou le colis reviendra.
              </p>
            )}
            <button
              onClick={handleTrack}
              disabled={busy !== null}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              {busy === 'track' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Actualiser le suivi
            </button>
            {trackError && <p className="text-xs text-red-600">{trackError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}