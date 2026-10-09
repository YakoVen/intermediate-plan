import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { trackOrder, DzshipError, getDefaultCourier } from '@/service/shipping/dzship';
import { getOrderById } from '@/service/firebase/database';
import { applyTrackingSync, coerceStatus } from '@/service/shipping/shipments';
import { mapStatusToState } from '@/service/shipping/status-map';

/**
 * POST /api/shipping/track
 *
 * Body: `{ orderId?: string, trackingNumber?: string, courier?: string }`
 *
 * Pulls live status from the courier and stores it. Give `orderId` and the
 * result is written back to the order; give `trackingNumber` alone and it is
 * read-only.
 *
 * Poll this on page views rather than on a tight loop — the gateway allows 60
 * tracking calls/minute/IP and 5,000/day, which a per-render fetch would burn
 * quickly (docs/endpoints.md).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, trackingNumber: inputTracking, courier } = body ?? {};

    let resolvedCourier = courier || getDefaultCourier();

    if (orderId) {
      const order = await getOrderById(orderId);
      if (!order) return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });

      if (!order.trackingNumber) {
        // Not shipped yet: this is a normal state, not an error.
        return NextResponse.json({
          shipped: false,
          status: order.courierStatus ?? null,
          state: order.state,
        });
      }

      resolvedCourier = courier || order.courier || getDefaultCourier();
      const tracking = await trackOrder(order.trackingNumber, resolvedCourier);
      const status = coerceStatus(tracking.status);
      const state = mapStatusToState(status);

      await applyTrackingSync(order.id, {
        courierStatus: status,
        rawStatus: tracking.rawStatus,
        state,
        lastTrackedAt: new Date().toISOString(),
        newEvent: tracking.events.length
          ? {
              status,
              raw: tracking.rawStatus,
              timestamp: tracking.events[tracking.events.length - 1].timestamp,
            }
          : undefined,
      });

      return NextResponse.json({
        shipped: true,
        trackingNumber: order.trackingNumber,
        courier: resolvedCourier,
        status,
        rawStatus: tracking.rawStatus,
        state,
        events: tracking.events,
      });
    }

    if (!inputTracking) {
      return NextResponse.json({ error: 'orderId ou trackingNumber manquant.' }, { status: 400 });
    }

    const tracking = await trackOrder(inputTracking, resolvedCourier);
    return NextResponse.json({
      shipped: true,
      trackingNumber: inputTracking,
      courier: resolvedCourier,
      status: coerceStatus(tracking.status),
      rawStatus: tracking.rawStatus,
      state: mapStatusToState(coerceStatus(tracking.status)),
      events: tracking.events,
    });
  } catch (error) {
    if (error instanceof DzshipError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          ...(error.retryAfter !== undefined ? { retryAfter: error.retryAfter } : {}),
        },
        { status: error.retryable ? 503 : 400 }
      );
    }
    console.error('shipping/track error', error);
    return NextResponse.json({ error: 'Impossible de suivre ce colis.' }, { status: 500 });
  }
}