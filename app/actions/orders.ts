'use server';

import { createOrder, createFailedOrder, saveAbandonedCart, updateAbandonedCartStatus, validateCoupon, incrementCouponUsage } from '@/service/firebase/database';
import { CartItem } from '@/interfaces/order';

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
    const deliveryFee = Number(formData.get('deliveryFee') || 0);
    const discount = Number(formData.get('discount') || 0);
    const couponCode = formData.get('couponCode') as string || undefined;
    const discountId = formData.get('discountId') as string || undefined;
    const total = Number(formData.get('total'));
    const userId = formData.get('userId') as string || undefined;
    const sessionId = formData.get('sessionId') as string || undefined;

    if (!name || !phone || !wilaya || !items?.length) {
      return { success: false, error: 'Champs requis manquants' };
    }

    const phoneClean = phone.replace(/\s/g, '');
    if (!/^0[5-7]\d{8}$/.test(phoneClean)) {
      return { success: false, error: 'Numéro de téléphone invalide' };
    }

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
      commune,
      address,
      deliveryMethod,
      items,
      subtotal,
      deliveryFee,
      discount,
      couponCode,
      discountId,
      total,
      state: 0,
      date: new Date().toISOString(),
      trackingHistory: [{ status: 0, timestamp: new Date().toISOString(), note: 'Commande passée' }],
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
