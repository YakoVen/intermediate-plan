'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Truck, Building2, Tag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/service/Utils';
import { wilayas } from '@/service/constants';
import { getDeliveryZones } from '@/service/firebase/database';
import { DeliveryZone } from '@/interfaces/delivery-zone';
import { createOrderAction } from '@/app/actions/orders';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, sessionId } = useCart();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'desk'>('home');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    getDeliveryZones().then(setZones).catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length === 0) router.push('/cart');
  }, [items.length, router]);

  const wilayaIndex = wilayas.indexOf(selectedWilaya) + 1;
  const zone = zones.find((z) => z.wilayaId === wilayaIndex);
  const deliveryCost = selectedWilaya
    ? zone
      ? deliveryMethod === 'home' ? zone.homePrice : zone.deskPrice
      : deliveryMethod === 'home' ? 800 : 400
    : 0;
  const homePrice = zone?.homePrice ?? 800;
  const deskPrice = zone?.deskPrice ?? 400;
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
    if (!selectedWilaya) {
      toast.error('Selectionnez une wilaya');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('items', JSON.stringify(items));
      formData.append('deliveryMethod', deliveryMethod);
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
                <input name="phone" required type="tel" placeholder="05XX XX XX XX" defaultValue={userProfile?.phone || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Email (optionnel)</label>
                <input name="email" type="email" defaultValue={userProfile?.email || currentUser?.email || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Wilaya</label>
                <select name="wilaya" required value={selectedWilaya} onChange={(e) => setSelectedWilaya(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-white">
                  <option value="">Sélectionner...</option>
                  {wilayas.map((w, i) => (
                    <option key={i} value={w}>{String(i + 1).padStart(2, '0')} - {w}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Commune</label>
                <input name="commune" required type="text" defaultValue={defaultAddress?.commune || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Adresse complète</label>
                <textarea name="address" required rows={2} defaultValue={defaultAddress?.address || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600" />
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
                <div className="font-bold text-gray-900">{selectedWilaya ? formatPrice(homePrice) : '--'}</div>
              </label>

              <label className={`cursor-pointer flex items-center p-4 border-2 rounded-xl transition ${deliveryMethod === 'desk' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="delivery" value="desk" checked={deliveryMethod === 'desk'} onChange={() => setDeliveryMethod('desk')} className="hidden" />
                <Building2 className={`w-6 h-6 mr-3 ${deliveryMethod === 'desk' ? 'text-indigo-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Point de relais</div>
                  <div className="text-sm text-gray-500">Bureau de livraison</div>
                </div>
                <div className="font-bold text-gray-900">{selectedWilaya ? formatPrice(deskPrice) : '--'}</div>
              </label>
            </div>
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
                  <span>{selectedWilaya ? formatPrice(deliveryCost) : '--'}</span>
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

            <button type="submit" disabled={loading || !selectedWilaya}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50">
              {loading ? 'Traitement...' : (<><Check className="w-5 h-5" /> Confirmer la commande</>)}
            </button>
            <p className="text-xs text-center text-gray-500">Paiement à la livraison</p>
          </div>
        </div>
      </form>
    </div>
  );
}
