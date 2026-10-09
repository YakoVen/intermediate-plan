import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getDesks, DzshipError, getDefaultCourier } from '@/service/shipping/dzship';
import { resolveShipCode, supportsDeskList } from '@/service/shipping/wilaya-data';

/**
 * POST /api/shipping/desks
 *
 * Body: `{ wilayaCode: number, courier?: string }`
 *
 * Stop desks in one wilaya, so the customer picks a pickup point rather than
 * typing an address the courier has to guess. Prefer a stop desk when you can:
 * cheaper, faster, and refusal rates drop because showing up is
 * self-selection (docs/cash-on-delivery.md).
 *
 * Cache per courier+wilaya for a day — desk lists change a few times a year.
 */
export async function POST(request: NextRequest) {
  const courier = request.nextUrl.searchParams.get('courier') || getDefaultCourier();

  try {
    const body = await request.json();
    const wilayaCode = body?.wilayaCode;
    const requestedCourier = (body?.courier || courier).toLowerCase();

    if (!Number.isInteger(wilayaCode) || wilayaCode < 1 || wilayaCode > 69) {
      return NextResponse.json({ error: 'Wilaya invalide.' }, { status: 400 });
    }

    // ZR Express (Procolis) and Colivraison publish no desk list at all.
    // Answer before calling so the UI can hide the option instead of erroring.
    if (!supportsDeskList(requestedCourier)) {
      return NextResponse.json({ supported: false, desks: [], reason: 'NOT_SUPPORTED' });
    }

    const desks = await getDesks(resolveShipCode(wilayaCode), requestedCourier);

    // An empty list is a valid answer: this courier has no desk in that wilaya.
    return NextResponse.json({ supported: true, desks, wilayaCode });
  } catch (error) {
    if (error instanceof DzshipError) {
      if (error.code === 'NOT_SUPPORTED') {
        return NextResponse.json({ supported: false, desks: [], reason: 'NOT_SUPPORTED' });
      }
      return NextResponse.json(
        { error: error.message, code: error.code, supported: true, desks: [] },
        { status: error.retryable ? 503 : 400 }
      );
    }
    console.error('shipping/desks error', error);
    return NextResponse.json({ error: 'Impossible de charger les points de relais.' }, { status: 500 });
  }
}