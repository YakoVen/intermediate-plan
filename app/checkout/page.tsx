'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Truck, Building2, Tag, Loader2, Info } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/service/Utils';
import { getDeliveryZones } from '@/service/firebase/database';
import { DeliveryZone } from '@/interfaces/delivery-zone';
import { createOrderAction } from '@/app/actions/orders';
import AddressPicker from '@/components/shipping/address-picker';
import StopDeskPicker from '@/components/shipping/stop-desk-picker';
import type { WilayaInfo } from '@/interfaces/shipment';
import toast from 'react-hot-toast';

interface Quote {
  deliveryFee: number;
  returnFee: number;
  currency: string;
  courier: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, sessionId } = useCart();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'desk'>('home');

  // Address: numeric wilaya code + exact commune spelling. The old model stored
  // a wilaya *name* and derived the code with `indexOf(name) + 1`, which breaks
  // on accents and on any change to the list order.
  const [wilayaCode, setWilayaCode] = useState<number | null>(null);
  const [wilayaInfo, setWilayaInfo] = useState<WilayaInfo | null>(null);
  const [communeName, setCommuneName] = useState('');

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Stop desk
  const [stopDeskId, setStopDeskId] = useState('');
  const [stopDeskName, setStopDeskName] = useState('');

  // Live quote from the courier gateway, with static zones as fallback.
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [useFallbackZones, setUseFallbackZones] = useState(false);

  useEffect(() => {
    getDeliveryZones().then(setZones).catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length === 0) router.push('/cart');
  }, [items.length, router]);

  /**
   * Quote delivery for the current address.
   *
   * Live rates beat hardcoded tables because fees vary by wilaya, commune,
   * delivery type and over time — a flat national price quietly loses money on
   * the Grand Sud. Falls back to the admin's `delivery_zones` when the gateway
   * is unreachable, so checkout never blocks on a third party.
   */
  const fetchQuote = useCallback(async () => {
    if (!wilayaCode) {
      setQuote(null);
      return;
    }
    setQuoting(true);
    setQuoteError('');
    try {
      const res = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wilayaCode, deliveryMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cotation indisponible.');
      setQuote({
        deliveryFee: data.deliveryFee,
        returnFee: data.returnFee,
        currency: data.currency || 'DZD',
        courier: data.courier,
      });
      setUseFallbackZones(false);
    } catch (err) {
      setQuote(null);
      setQuoteError(err instanceof Error ? err.message : 'Cotation indisponible.');
      setUseFallbackZones(true);
    } finally {
      setQuoting(false);
    }
  }, [wilayaCode, deliveryMethod]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // Static zone price, used only when the live quote fails.
  const zone = zones.find((z) => z.wilayaId === (wilayaInfo?.shipAs ?? wilayaCode));
  const zonePrice = deliveryMethod === 'home' ? zone?.homePrice ?? 800 : zone?.deskPrice ?? 400;

  const deliveryCost = quote?.deliveryFee ?? (useFallbackZones && wilayaCode ? zonePrice : 0);
  const returnFee = quote?.returnFee ?? 0;
  const homePrice = quote?.deliveryFee ?? zone?.homePrice ?? 800;
  const deskPrice = quote?.deliveryFee ?? zone?.deskPrice ?? 400;
  const total = Math.max(0, subtotal + deliveryCost - discount);

  const handleValidateCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponError('');
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon, orderTotal: subtotal })
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
        toast.success(data.message || 'Code applique !');
      } else {
        setDiscount(0);
        setCouponError(data.message || 'Code promo invalide.');
      }
    } catch (e) {
      console.error(e);
      setCouponError('Erreur de validation.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!wilayaCode || !communeName) {
      toast.error('Selectionnez une wilaya et une commune');
      return;
    }
    if (deliveryMethod === 'desk' && !stopDeskId) {
      toast.error('Choisissez un point de relais');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('items', JSON.stringify(items));
      formData.append('deliveryMethod', deliveryMethod);
      formData.append('wilayaCode', String(wilayaCode));
      formData.append('communeName', communeName);
      formData.append('stopDeskId', stopDeskId);
      formData.append('stopDeskName', stopDeskName);
      formData.append('returnFee', String(returnFee));
      formData.append('subtotal', subtotal.toString());
      formData.append('deliveryFee', deliveryCost.toString());
      formData.append('discount', discount.toString());
      formData.append('couponCode', coupon.trim().toUpperCase());
      formData.append('total', total.toString());
      if (currentUser) formData.append('userId', currentUser.uid);
      if (sessionId) formData.append('sessionId', sessionId);

      const result = await createOrderAction(formData);
      if (result.success && result.orderId) {
        toast.success('Commande confirmee !');
        clearCart();
        router.push(`/track?id=${result.orderId}`);
      } else {
        toast.error(result.error || 'Erreur lors de la commande');
      }
    } catch {
      toast.error('Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  const defaultAddress = userProfile?.addresses?.[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 space-y-8">
          {/* Informations personnelles */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Informations de livraison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nom complet</label>
                <input name="fullName" required type="text" defaultValue={userProfile?.displayName || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  name="phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  placeholder="0551234567"
                  pattern="0[5-7][0-9]{8}"
                  title="Numéro algérien : 05, 06 ou 07 suivi de 8 chiffres"
                  defaultValue={userProfile?.phone || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                />
                <p className="text-xs text-gray-500">Format 05/06/07 + 8 chiffres. C&apos;est le numéro que le transporteur appelle.</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Email (optionnel)</label>
                <input name="email" type="email" defaultValue={userProfile?.email || currentUser?.email || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div className="md:col-span-2">
                <AddressPicker
                  wilayaCode={wilayaCode}
                  communeName={communeName}
                  wilayaName={wilayaInfo?.nameFr}
                  onWilayaChange={(code, info) => {
                    setWilayaCode(code);
                    setWilayaInfo(info);
                  }}
                  onCommuneChange={setCommuneName}
                />
                {/* Hidden mirrors so the server action reads the same values. */}
                <input type="hidden" name="wilaya" value={wilayaInfo?.nameFr || ''} />
                <input type="hidden" name="commune" value={communeName} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Adresse complète {deliveryMethod === 'home' ? '(obligatoire)' : '(optionnelle)'}
                </label>
                <textarea
                  name="address"
                  rows={2}
                  required={deliveryMethod === 'home'}
                  defaultValue={defaultAddress?.address || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Mode de livraison */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Mode de livraison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`cursor-pointer flex items-center p-4 border-2 rounded-xl transition ${deliveryMethod === 'home' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="delivery" value="home" checked={deliveryMethod === 'home'} onChange={() => setDeliveryMethod('home')} className="hidden" />
                <Truck className={`w-6 h-6 mr-3 ${deliveryMethod === 'home' ? 'text-indigo-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">À domicile</div>
                  <div className="text-sm text-gray-500">Livraison jusqu&apos;à votre porte</div>
                </div>
                <div className="font-bold text-gray-900">{wilayaCode ? formatPrice(homePrice) : '--'}</div>
              </label>

              <label className={`cursor-pointer flex items-center p-4 border-2 rounded-xl transition ${deliveryMethod === 'desk' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="delivery" value="desk" checked={deliveryMethod === 'desk'} onChange={() => setDeliveryMethod('desk')} className="hidden" />
                <Building2 className={`w-6 h-6 mr-3 ${deliveryMethod === 'desk' ? 'text-indigo-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Point de relais</div>
                  <div className="text-sm text-gray-500">Bureau de livraison</div>
                </div>
                <div className="font-bold text-gray-900">{wilayaCode ? formatPrice(deskPrice) : '--'}</div>
              </label>
            </div>

            {/* Desk selection only makes sense once a wilaya is chosen. */}
            {deliveryMethod === 'desk' && wilayaCode && (
              <div className="pt-4 border-t border-gray-100">
                <StopDeskPicker
                  wilayaCode={wilayaCode}
                  courier={quote?.courier || 'sandbox'}
                  communeName={communeName}
                  value={stopDeskId}
                  onChange={(id, name) => {
                    setStopDeskId(id);
                    setStopDeskName(name);
                  }}
                />
              </div>
            )}

            {quoting && (
              <p className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 size={12} className="animate-spin" />
                Calcul du frais de livraison...
              </p>
            )}

            {quoteError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                <p className="text-xs text-amber-800 flex items-start gap-1">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  {quoteError}
                </p>
                {useFallbackZones && wilayaCode && (
                  <p className="text-xs text-amber-800">
                    Tarif de repli applique : <strong>{formatPrice(zonePrice)}</strong>
                  </p>
                )}
              </div>
            )}

            {quote && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1">
                <p className="text-xs text-blue-900 font-medium">
                  Livraison {formatPrice(quote.deliveryFee)} (transporteur : {quote.courier})
                </p>
                {quote.returnFee > 0 && (
                  <p className="text-xs text-blue-700">
                    Frais de retour : {formatPrice(quote.returnFee)} — factures uniquement en cas de refus.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Résumé de la commande */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-8">
            <h2 className="text-xl font-bold text-gray-900">Votre commande</h2>

            <div className="space-y-4 max-h-64 overflow-y-auto">
              {items.map((item, i) => (
                <div key={`${item.articleId}-${item.variantId || i}`} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-medium line-clamp-1">{item.title}</div>
                    {item.variantName && <div className="text-gray-500 text-xs">{item.variantName}</div>}
                    <div className="text-gray-500">Qté: {item.quantity}</div>
                    <div className="font-medium text-indigo-600">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="text" placeholder="Code promo" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 text-sm uppercase" />
                </div>
                <button type="button" onClick={handleValidateCoupon} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition">
                  Appliquer
                </button>
              </div>
              {couponError && <p className="text-red-600 text-xs">{couponError}</p>}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span>{wilayaCode ? formatPrice(deliveryCost) : '--'}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Remise</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="pt-2 flex justify-between font-bold text-lg text-gray-900 border-t border-gray-100">
                  <span>Total à payer</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || !wilayaCode || !communeName || (deliveryMethod === 'desk' && !stopDeskId)}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50">
              {loading ? 'Traitement...' : (<><Check className="w-5 h-5" /> Confirmer la commande</>)}
            </button>
            <p className="text-xs text-center text-gray-500">
              Paiement à la livraison ({formatPrice(total)}). Le colis est cree apres confirmation par telephone.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
