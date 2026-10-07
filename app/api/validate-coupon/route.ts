import { NextResponse } from 'next/server';
import { validateCoupon } from '@/service/firebase/database';

export async function POST(request: Request) {
  try {
    const { code, orderTotal } = await request.json();
    if (!code || typeof orderTotal !== 'number') {
      return NextResponse.json({ valid: false, message: 'Code et total requis.' }, { status: 400 });
    }
    const coupon = await validateCoupon(String(code).trim().toUpperCase());
    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'Code promo invalide.' });
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, message: 'Code promo expire.' });
    }
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, message: 'Code promo epuise.' });
    }
    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return NextResponse.json({ valid: false, message: `Minimum ${coupon.minOrderAmount} DA requis.` });
    }
    const discount = coupon.type === 'percentage'
      ? Math.round(orderTotal * (coupon.value / 100))
      : Math.min(coupon.value, orderTotal);
    return NextResponse.json({
      valid: true,
      discount,
      type: coupon.type,
      value: coupon.value,
      code: coupon.code,
      message: 'Code appliqué avec succès !',
    });
  } catch {
    return NextResponse.json({ valid: false, message: 'Erreur.' }, { status: 500 });
  }
}
