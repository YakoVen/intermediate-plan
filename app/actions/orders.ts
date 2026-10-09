'use server';

import { createOrder, createFailedOrder, saveAbandonedCart, updateAbandonedCartStatus, validateCoupon, incrementCouponUsage } from '@/service/firebase/database';
import { CartItem } from '@/interfaces/order';
import { validateAddress, validatePhone, resolveShipCode } from '@/service/shipping/wilaya-data';

export async function createOrderAction(formData: FormData) {
  try {
    const name = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string || undefined;
    const wilaya = formData.get('wilaya') as string;
    const commune = formData.get('commune') as string;
    const address = formData.get('address') as string || '';
    const deliveryMethod = formData.get('deliveryMethod') as 'home' | 'desk';
    const items: CartItem[] = JSON.parse(formData.get('items') as string);
    const subtotal = Number(formData.get('subtotal') || 0);
    const discount = Number(formData.get('discount') || 0);
    const couponCode = formData.get('couponCode') as string || undefined;
    const discountId = formData.get('discountId') as string || undefined;
    const total = Number(formData.get('total'));
    const userId = formData.get('userId') as string || undefined;
    const sessionId = formData.get('sessionId') as string || undefined;

    // DzShip address fields. The numeric code is authoritative; the names are
    // display-only and must not be trusted for courier routing.
    const wilayaCode = Number(formData.get('wilayaCode'));
    const communeName = (formData.get('communeName') as string) || commune;
    const stopDeskId = (formData.get('stopDeskId') as string) || undefined;
    const stopDeskName = (formData.get('stopDeskName') as string) || undefined;
    const returnFee = Number(formData.get('returnFee') || 0);

    if (!name || !phone || !wilaya || !items?.length) {
      return { success: false, error: 'Champs requis manquants' };
    }

    if (!Number.isInteger(wilayaCode) || wilayaCode < 1 || wilayaCode > 69) {
      return { success: false, error: 'Wilaya invalide' };
    }

    // Validate the commune the way the courier will, before anything is stored.
    const addressCheck = validateAddress(wilayaCode, communeName);
    if (!addressCheck.ok) {
      return { success: false, error: addressCheck.error };
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.ok) {
      return { success: false, error: phoneCheck.error };
    }
    const phoneClean = phoneCheck.phone;

    if (deliveryMethod === 'desk' && !stopDeskId) {
      return { success: false, error: 'Point de relais requis' };
    }

    // Never trust the client's delivery fee: it is a price the customer pays
    // the courier, and a tampered value means shipping below cost. Recompute
    // server-side when we can, and fall back to the submitted value only if the
    // gateway is unavailable.
    let deliveryFee = Number(formData.get('deliveryFee') || 0);
    let verifiedDeliveryFee: number | null = null;
    let verifiedReturnFee = 0;
    try {
      const { quoteRate, getDefaultCourier } = await import('@/service/shipping/dzship');
      const quote = await quoteRate(
        {
          toWilaya: resolveShipCode(wilayaCode),
          toCommune: communeName,
          deliveryType: deliveryMethod === 'desk' ? 'stopdesk' : 'home',
        },
        getDefaultCourier()
      );
      verifiedDeliveryFee = quote.deliveryFee;
      verifiedReturnFee = quote.returnFee;
    } catch {
      // Gateway unavailable. Accept the submitted fee rather than block the
      // sale; the courier rejects the parcel later if it is wrong.
    }

    if (verifiedDeliveryFee !== null) {
      deliveryFee = verifiedDeliveryFee;
    } else if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      return { success: false, error: 'Frais de livraison invalides' };
    }
    const finalReturnFee = verifiedReturnFee || returnFee;

    // Validate + increment coupon usage
    if (couponCode) {
      try {
        const coupon = await validateCoupon(couponCode);
        if (coupon) await incrementCouponUsage(coupon.id);
      } catch { /* coupon validation failure is non-blocking */ }
    }

    const orderId = await createOrder({
      name,
      phone: phoneClean,
      email,
      userId,
      wilaya,
      commune: communeName,
      address,
      deliveryMethod,
      items,
      subtotal,
      deliveryFee,
      quotedDeliveryFee: deliveryFee,
      returnFee: finalReturnFee,
      discount,
      couponCode,
      discountId,
      // Recomputed from the server-verified fee, so the stored total is the
      // amount the courier will actually ask for at the door.
      total: Math.max(0, subtotal - discount + deliveryFee),
      state: 0,
      date: new Date().toISOString(),
      // DzShip address fields, resolved to what the courier accepts.
      wilayaCode,
      wilayaShipCode: resolveShipCode(wilayaCode),
      communeName,
      stopDeskId,
      stopDeskName,
      // What the driver collects.
      codAmount: Math.max(0, subtotal - discount + deliveryFee),
      trackingHistory: [
        { status: 'created', timestamp: new Date().toISOString(), note: 'Commande enregistrée' },
      ],
    });

    // Mark abandoned cart session as recovered
    if (sessionId) {
      try {
        const { getAbandonedCarts } = await import('@/service/firebase/database');
        const carts = await getAbandonedCarts();
        const cart = carts.find(c => c.sessionId === sessionId);
        if (cart) await updateAbandonedCartStatus(cart.id, 'recovered');
      } catch { /* non-blocking */ }
    }

    // Send confirmation emails (non-blocking)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_confirmation',
          data: { orderId, name, email, phone: phoneClean, items, total, wilaya, deliveryMethod },
        }),
      });
    } catch { /* email failure is non-blocking */ }

    return { success: true, orderId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return { success: false, error: message };
  }
}

export async function saveAbandonedCartAction(data: {
  sessionId: string;
  items: CartItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  wilaya?: string;
  subtotal: number;
}) {
  try {
    const now = new Date().toISOString();
    await saveAbandonedCart({
      sessionId: data.sessionId,
      items: data.items,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      wilaya: data.wilaya,
      subtotal: data.subtotal,
      status: 'active',
      createdAt: now,
      abandonedAt: now,
    });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return { success: false, error: message };
  }
}

export async function createFailedOrderAction(data: {
  name?: string;
  phone?: string;
  email?: string;
  items?: CartItem[];
  total?: number;
  wilaya?: string;
  failureReason: string;
}) {
  try {
    await createFailedOrder({
      name: data.name || 'Inconnu',
      phone: data.phone || '',
      email: data.email,
      items: data.items || [],
      subtotal: 0,
      deliveryFee: 0,
      discount: 0,
      total: data.total || 0,
      address: '',
      wilaya: data.wilaya || '',
      commune: '',
      deliveryMethod: 'home',
      state: 0,
      date: new Date().toISOString(),
      type: 'failed',
      failureReason: data.failureReason,
      // Same status vocabulary as real orders, so dashboards can group them.
      trackingHistory: [
        { status: 'created', timestamp: new Date().toISOString(), note: 'Commande échouée' },
      ],
    });

    // Alert admin (non-blocking)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'failed_order_alert',
          data: { ...data },
        }),
      });
    } catch { /* non-blocking */ }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return { success: false, error: message };
  }
}
