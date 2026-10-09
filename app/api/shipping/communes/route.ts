import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAllCommunes, getCommunesForWilaya, resolveShipCode } from '@/service/shipping/wilaya-data';

/**
 * GET /api/shipping/communes?wilaya=16   communes of one wilaya
 * GET /api/shipping/communes?q=bab        search across all, max 100 rows
 *
 * Exists so the client gets only the communes it needs instead of shipping
 * the 160 KB dataset in the bundle.
 *
 * Always scope to a wilaya in the UI: 36 commune names repeat across wilayas
 * (`El Marsa` is in Chlef, Alger and Skikda), and matching a commune by name
 * alone is how parcels end up routed to the wrong hub
 * (docs/wilayas-and-communes.md).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const wilayaCode = params.get('wilaya');
  const query = params.get('q');
  const headers = { 'Cache-Control': 'public, max-age=86400' };

  let communes;

  if (wilayaCode) {
    const code = Number(wilayaCode);
    if (!Number.isInteger(code) || code < 1 || code > 69) {
      return NextResponse.json({ error: 'Wilaya invalide.' }, { status: 400 });
    }
    // Resolve through shipAs, so a 2026 wilaya lists its parent's communes.
    communes = getCommunesForWilaya(resolveShipCode(code));
  } else {
    communes = getAllCommunes();
  }

  if (query) {
    const needle = query.toLowerCase();
    communes = communes.filter(
      (c) => c.nameFr.toLowerCase().includes(needle) || (c.nameAr || '').includes(query)
    );
  }

  return NextResponse.json(communes.slice(0, query ? 100 : communes.length), { headers });
}