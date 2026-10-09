import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import {
  getAllWilayas,
  getShippableWilayas,
  getWilaya,
  resolveShipCode,
} from '@/service/shipping/wilaya-data';

/**
 * GET /api/shipping/wilayas            all 69, with courierSupported + shipAs
 * GET /api/shipping/wilayas?ship=1     only the 58 couriers deliver to
 * GET /api/shipping/wilayas?code=16    one wilaya
 *
 * Reference data. Vendored locally rather than proxied, so the address form
 * still works when the gateway is down — shipping is not a place to add a
 * network dependency. Served with a day-long cache header, matching the
 * gateway's own caching advice.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const headers = { 'Cache-Control': 'public, max-age=86400' };

  if (params.get('code')) {
    const code = Number(params.get('code'));
    const wilaya = Number.isInteger(code) ? getWilaya(code) : undefined;
    if (!wilaya) {
      return NextResponse.json({ error: 'Wilaya introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ ...wilaya, shipCode: resolveShipCode(code) }, { headers });
  }

  // Default to the full 2026 division so the picker shows the names customers
  // actually use today; `shipCode` does the translation at order time.
  const wilayas = params.get('ship') === '1' ? getShippableWilayas() : getAllWilayas();

  return NextResponse.json(
    wilayas.map((w) => ({ ...w, shipCode: resolveShipCode(w.code) })),
    { headers }
  );
}