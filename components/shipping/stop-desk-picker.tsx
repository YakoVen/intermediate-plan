'use client';

import { useEffect, useState } from 'react';
import { Building2, Loader2, AlertCircle, MapPin } from 'lucide-react';
import type { StopDesk } from '@/interfaces/shipment';

/**
 * Stop-desk picker.
 *
 * Offer this whenever the courier supports it. A stop-desk parcel is cheaper,
 * faster, and returns less, because the customer showing up is self-selection
 * (docs/cash-on-delivery.md).
 *
 * Handles the two real-world shapes:
 *  - courier publishes desks  -> render the list
 *  - `422 NOT_SUPPORTED` (ZR Express Procolis, Colivraison) -> say so plainly
 *  - empty list -> courier has no desk in that wilaya, so say that too
 *
 * Routing note from the docs: Yalidine family, NOEST, ZR (new), Zimou, Ecom
 * Delivery, MDM and Near Delivery route by the desk id; every Ecotrack courier,
 * Maystro and Elogistia take no desk id at all and route by commune. So the
 * commune must stay selected even when a desk is chosen.
 */

interface StopDeskPickerProps {
  wilayaCode: number | null;
  courier: string;
  communeName: string;
  value: string;
  onChange: (deskId: string, deskName: string, deskCommune: string) => void;
}

export default function StopDeskPicker({
  wilayaCode,
  courier,
  communeName,
  value,
  onChange,
}: StopDeskPickerProps) {
  const [desks, setDesks] = useState<StopDesk[]>([]);
  const [supported, setSupported] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!wilayaCode) {
      setDesks([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`/api/shipping/desks?courier=${encodeURIComponent(courier)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wilayaCode, courier }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.supported === false) {
          setSupported(false);
          setDesks([]);
          return;
        }
        setSupported(true);
        setDesks(data.desks || []);
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger les points de relais.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [wilayaCode, courier]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <Loader2 size={16} className="animate-spin" />
        Recherche des points de relais...
      </div>
    );
  }

  if (!supported) {
    return (
      <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg flex items-start gap-1">
        <AlertCircle size={12} className="mt-0.5 shrink-0" />
        Ce transporteur ne publie pas la liste de ses bureaux. Utilisez la livraison à domicile.
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-red-600 flex items-center gap-1">
        <AlertCircle size={12} />
        {error}
      </p>
    );
  }

  if (desks.length === 0) {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <AlertCircle size={12} />
        Aucun point de relais dans cette wilaya. Choisissez la livraison à domicile.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="stopdesk-select" className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Building2 size={16} />
        Point de retrait
      </label>
      <select
        id="stopdesk-select"
        value={value}
        onChange={(e) => {
          const desk = desks.find((d) => d.id === e.target.value);
          // Desk id + the desk's commune: covers couriers that route by either.
          onChange(e.target.value, desk?.name ?? '', desk?.communeName || communeName);
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600"
      >
        <option value="">Choisir un bureau...</option>
        {desks.map((desk) => (
          <option key={desk.id} value={desk.id}>
            {desk.name} - {desk.communeName}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 flex items-start gap-1">
        <MapPin size={12} className="mt-0.5 shrink-0" />
        Moins cher et plus rapide qu&apos;à domicile, avec moins de refus de livraison.
      </p>
    </div>
  );
}