import { NextResponse } from 'next/server';
import { listCouriers, getDefaultCourier, getFromWilaya, DzshipError } from '@/service/shipping/dzship';

/**
 * GET /api/shipping/couriers            all supported couriers
 * GET /api/shipping/couriers?platform=ecotrack
 * GET /api/shipping/couriers?q=rocket
 *
 * Reference data with one app-specific addition: `configured` says whether this
 * deployment actually has the env vars to call that courier. The UI uses it to
 * offer only usable options instead of failing at checkout.
 *
 * Credentials themselves are never in the response — only whether they exist.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get('platform') || undefined;
  const q = url.searchParams.get('q') || undefined;

  try {
    const couriers = await listCouriers({ platform, q });
    return NextResponse.json(
      {
        defaultCourier: getDefaultCourier(),
        fromWilaya: getFromWilaya(),
        couriers,
      },
      { headers: { 'Cache-Control': 'public, max-age=86400' } }
    );
  } catch (error) {
    if (error instanceof DzshipError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 503 });
    }
    console.error('shipping/couriers error', error);
    return NextResponse.json({ error: 'Impossible de charger les transporteurs.' }, { status: 500 });
  }
}