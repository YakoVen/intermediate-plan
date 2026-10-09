import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createOrder, DzshipError, getDefaultCourier } from '@/service/shipping/dzship';
import { getOrderById } from '@/service/firebase/database';
import { saveShipment, canShip } from '@/service/shipping/shipments';
import { DZSHIP_DELIVERY_TYPE, type CourierStatus } from '@/interfaces/shipment';
import { resolveShipCode, validateAddress, validatePhone } from '@/service/shipping/wilaya-data';
import { mapStatusToState } from '@/service/shipping/status-map';

/**
 * POST /api/shipping/create
 *
 * Body: `{ orderId: string, courier?: string, notes?: string }`
 *
 * Creates the parcel for an existing order. Deliberately NOT called from
 * checkout: an order is confirmed by phone first, then shipped from here
 * (docs/cash-on-delivery.md). Creating at checkout is the classic first-build
 * mistake — you ship to unconfirmed customers and eat the return fees.
 *
 * Idempotent by `reference`: the order id is sent as the courier reference, and
 * an order that already has a `trackingNumber` is refused. A retried create is
 * a duplicate parcel, so this route never retries.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, courier, notes } = body ?? {};

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId manquant.' }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
    }

    const shippable = canShip(order);
    if (!shippable.ok) {
      return NextResponse.json({ error: shippable.reason }, { status: 409 });
    }

    // Validate the address the way the courier will, before spending a create.
    const wilayaCode = order.wilayaCode;
    if (!wilayaCode) {
      return NextResponse.json({ error: 'Wilaya manquante sur la commande.' }, { status: 400 });
    }

    const addressCheck = validateAddress(wilayaCode, order.communeName || order.commune);
    if (!addressCheck.ok) {
      return NextResponse.json({ error: addressCheck.error }, { status: 400 });
    }

    const phoneCheck = validatePhone(order.phone);
    if (!phoneCheck.ok) {
      return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
    }

    const shipCode = resolveShipCode(wilayaCode);
    const deliveryType = DZSHIP_DELIVERY_TYPE[order.deliveryMethod === 'desk' ? 'desk' : 'home'];

    if (deliveryType === 'stopdesk' && !order.stopDeskId) {
      return NextResponse.json(
        { error: 'Point de relais non selectionne. Choisissez un bureau de retrait.' },
        { status: 400 }
      );
    }

    // Parcels carry what is inside, not the store's internal ids.
    const productList = order.items
      .map((item) => `${item.title}${item.variantName ? ` (${item.variantName})` : ''} x${item.quantity}`)
      .join(', ');

    const result = await createOrder({
      orderId: order.id,
      courier: (courier || order.courier || getDefaultCourier()).toLowerCase(),
      recipient: {
        fullName: order.name,
        phone: phoneCheck.phone,
        ...(order.phoneAlt ? { phoneAlt: order.phoneAlt } : {}),
        wilayaCode: shipCode,
        communeName: order.communeName || order.commune,
        ...(order.address ? { addressLine: order.address } : {}),
      },
      deliveryType,
      ...(order.stopDeskId ? { stopDeskId: order.stopDeskId } : {}),
      productList,
      codAmount: order.codAmount ?? order.total,
      declaredValue: order.total,
      ...(order.hasOpenPackage !== undefined ? { hasOpenPackage: order.hasOpenPackage } : {}),
      ...(notes ? { notes } : {}),
    });

    await saveShipment(order.id, {
      trackingNumber: result.trackingNumber,
      courier: (courier || order.courier || getDefaultCourier()).toLowerCase(),
      courierStatus: result.status as CourierStatus,
      labelUrl: result.labelUrl,
      stopDeskId: order.stopDeskId,
      stopDeskName: order.stopDeskName,
      wilayaCode,
      wilayaShipCode: shipCode,
      communeName: order.communeName || order.commune,
      codAmount: order.codAmount ?? order.total,
      returnFee: order.returnFee,
      quotedDeliveryFee: order.quotedDeliveryFee ?? order.deliveryFee,
      ...(order.hasOpenPackage !== undefined ? { hasOpenPackage: order.hasOpenPackage } : {}),
      shippedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      trackingNumber: result.trackingNumber,
      status: result.status,
      labelUrl: result.labelUrl,
      state: mapStatusToState(result.status),
    });
  } catch (error) {
    if (error instanceof DzshipError) {
      // 409/400 for merchant errors, 503 for retryable gateway trouble.
      const status = error.code === 'COURIER_ERROR' ? 502 : error.isConfigProblem ? 503 : 400;
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          fields: error.fields,
          ...(error.retryAfter !== undefined ? { retryAfter: error.retryAfter } : {}),
        },
        { status }
      );
    }
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('shipping/create error', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}