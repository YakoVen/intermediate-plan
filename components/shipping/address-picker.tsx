'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';
import type { WilayaInfo, CommuneInfo } from '@/interfaces/shipment';

/**
 * Wilaya + commune picker.
 *
 * The two-step pattern from the dzship docs: pick a wilaya by code, then a
 * commune from that wilaya's list. Free-text commune input is the single most
 * common cause of failed parcel creation — spelling drift, accents, and 36
 * homonym names across wilayas (`El Marsa` exists in Chlef, Alger and Skikda).
 *
 * Shows the 2026 division (69 wilayas) because customers in Bou Saada now say
 * they live in Bou Saada, not M'Sila. The translation to the courier-accepted
 * code happens server-side in `resolveShipCode`, never here.
 */

interface AddressPickerProps {
  wilayaCode: number | null;
  communeName: string;
  onWilayaChange: (code: number, wilaya: WilayaInfo) => void;
  onCommuneChange: (name: string) => void;
  wilayaName?: string;
  error?: string;
  disabled?: boolean;
}

export default function AddressPicker({
  wilayaCode,
  communeName,
  onWilayaChange,
  onCommuneChange,
  wilayaName,
  error,
  disabled = false,
}: AddressPickerProps) {
  const [wilayas, setWilayas] = useState<WilayaInfo[]>([]);
  const [communes, setCommunes] = useState<CommuneInfo[]>([]);
  const [loadingWilayas, setLoadingWilayas] = useState(true);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [loadError, setLoadError] = useState<string>('');

  // Reference data: one fetch, cached a day by the route handler.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/shipping/wilayas')
      .then((r) => {
        if (!r.ok) throw new Error('wilayas');
        return r.json();
      })
      .then((data: WilayaInfo[]) => {
        if (!cancelled) setWilayas(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Impossible de charger les wilayas.');
      })
      .finally(() => {
        if (!cancelled) setLoadingWilayas(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Communes follow the wilaya. Refetch only when the wilaya actually changes.
  useEffect(() => {
    if (!wilayaCode) {
      setCommunes([]);
      return;
    }
    let cancelled = false;
    setLoadingCommunes(true);
    fetch(`/api/shipping/communes?wilaya=${wilayaCode}`)
      .then((r) => {
        if (!r.ok) throw new Error('communes');
        return r.json();
      })
      .then((data: CommuneInfo[]) => {
        if (!cancelled) setCommunes(data);
      })
      .catch(() => {
        if (!cancelled) setCommunes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCommunes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wilayaCode]);

  const handleWilayaChange = (code: number) => {
    const wilaya = wilayas.find((w) => w.code === code);
    if (!wilaya) return;
    // A different wilaya invalidates the commune: 36 names repeat across wilayas.
    onCommuneChange('');
    onWilayaChange(code, wilaya);
  };

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle size={16} />
          {loadError}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="wilaya-select" className="text-sm font-medium text-gray-700">
          Wilaya
        </label>
        <div className="relative">
          <select
            id="wilaya-select"
            value={wilayaCode ?? ''}
            onChange={(e) => handleWilayaChange(Number(e.target.value))}
            disabled={disabled || loadingWilayas}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600 disabled:bg-gray-50"
          >
            <option value="">
              {loadingWilayas ? 'Chargement...' : 'Sélectionner...'}
            </option>
            {wilayas.map((w) => (
              <option key={w.code} value={w.code}>
                {String(w.code).padStart(2, '0')} - {w.nameFr}
                {w.courierSupported === false ? ' (livraison via ' + (w.shipAsName || 'autre') + ')' : ''}
              </option>
            ))}
          </select>
        </div>
        {wilayaName && <p className="text-xs text-gray-500">Wilaya selectionnée : {wilayaName}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="commune-select" className="text-sm font-medium text-gray-700">
          Commune
        </label>
        <div className="relative">
          <select
            id="commune-select"
            value={communeName}
            onChange={(e) => onCommuneChange(e.target.value)}
            disabled={disabled || !wilayaCode || loadingCommunes}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600 disabled:bg-gray-50"
          >
            <option value="">
              {!wilayaCode
                ? 'Choisissez d\'abord une wilaya'
                : loadingCommunes
                  ? 'Chargement...'
                  : 'Sélectionner...'}
            </option>
            {communes.map((c) => (
              <option key={`${c.wilayaCode}-${c.nameFr}`} value={c.nameFr}>
                {c.nameFr}
              </option>
            ))}
          </select>
          {loadingCommunes && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>
        <p className="text-xs text-gray-500 flex items-start gap-1">
          <MapPin size={12} className="mt-0.5 shrink-0" />
          La commune est envoyée au transporteur avec son libellé exact. Une faute fait échouer la livraison.
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}