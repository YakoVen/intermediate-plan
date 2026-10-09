import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { quoteRate, DzshipError, getDefaultCourier } from '@/service/shipping/dzship';
import { DZSHIP_DELIVERY_TYPE } from '@/interfaces/shipment';
import { resolveShipCode, validateAddress } from '@/service/shipping/wilaya-data';

/**
 * POST /api/shipping/quote
 *
 * Body: `{ wilayaCode: number, communeName?: string, deliveryMethod: 'home'|'desk', courier?: string }`
 *
 * Public. Sends no credentials to the browser — only the resulting fees. The
 * address is validated here rather than at order time so the customer finds
 * out before paying, which is the whole point of the commune picker.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wilayaCode, communeName, deliveryMethod = 'home', courier } = body ?? {};

    if (!Number.isInteger(wilayaCode) || wilayaCode < 1 || wilayaCode > 69) {
      return NextResponse.json({ error: 'Wilaya invalide.' }, { status: 400 });
    }

    if (communeName) {
      // Match on the code the courier will see, not the one the customer picked.
      const validation = validateAddress(wilayaCode, communeName);
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    const targetWilaya = resolveShipCode(wilayaCode);

    const quote = await quoteRate(
      {
        toWilaya: targetWilaya,
        ...(communeName ? { toCommune: communeName } : {}),
        deliveryType: DZSHIP_DELIVERY_TYPE[deliveryMethod === 'desk' ? 'desk' : 'home'],
      },
      courier || getDefaultCourier()
    );

    return NextResponse.json({
      deliveryFee: quote.deliveryFee,
      returnFee: quote.returnFee,
      total: quote.total,
      currency: quote.currency || 'DZD',
      // Lets the checkout show which courier priced it.
      courier: courier || getDefaultCourier(),
      wilayaCode: targetWilaya,
    });
  } catch (error) {
    if (error instanceof DzshipError) {
      // Tell the caller whether to retry or to fall back to static zones.
      const status = error.retryable ? 503 : error.isConfigProblem ? 503 : 400;
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          retryable: error.retryable,
          ...(error.retryAfter !== undefined ? { retryAfter: error.retryAfter } : {}),
        },
        { status }
      );
    }
    console.error('shipping/quote error', error);
    return NextResponse.json({ error: 'Impossible de calculer les frais de livraison.' }, { status: 500 });
  }
}