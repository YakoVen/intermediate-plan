import 'server-only';

import type {
  CreateShipmentInput,
  CreateShipmentResult,
  CourierInfo,
  RatesQuery,
  ShipmentQuote,
  ShipmentTracking,
  StopDesk,
  TrackingEvent,
} from '@/interfaces/shipment';
import { isCourierStatus } from '@/service/shipping/status-map';
import type { CourierStatus } from '@/interfaces/shipment';

/**
 * DzShip gateway client — the ONLY file that talks to freeship.dzbuild.com.
 *
 * Server-side by construction (`server-only` at the top), because courier
 * credentials travel in every request and anyone holding them can create
 * parcels on the merchant's account. Nothing under `service/shipping/` other
 * than this file reads `DZSHIP_*` or `*_API_*` env vars, and this file must
 * only ever be imported from route handlers, server actions or server
 * components. A client component importing it is a build error, by design.
 *
 * Endpoints: POST /v1/orders, /v1/track, /v1/rates, /v1/desks.
 * Docs: https://github.com/DZBuild-com/dzship/blob/main/docs/endpoints.md
 */

const BASE_URL = (process.env.DZSHIP_BASE_URL || 'https://freeship.dzbuild.com').replace(/\/+$/, '');
const DEFAULT_COURIER = process.env.DZSHIP_DEFAULT_COURIER || 'sandbox';
const FROM_WILAYA = Number(process.env.DZSHIP_FROM_WILAYA || '16');
const TIMEOUT_MS = Number(process.env.DZSHIP_TIMEOUT_MS || '15000');

/** Typed wrapper so callers can branch on `code` instead of parsing messages. */
export class DzshipError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;
  /** Seconds to wait, from the `Retry-After` header on 429. */
  readonly retryAfter?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'DzshipError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }

  /** 429 and 503 are the only statuses worth retrying as-is. */
  get retryable(): boolean {
    return this.code === 'rate_limited' || this.code === 'overloaded' || this.status >= 500;
  }

  /** Merchant misconfiguration, not a transient fault. Show it as a config problem. */
  get isConfigProblem(): boolean {
    return this.code === 'CONFIGURATION_ERROR' || this.code === 'EGRESS_BLOCKED';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

/**
 * One request helper for the whole gateway.
 *
 * Two behaviours worth knowing:
 *  - The gateway caps `timeoutMs` at 30s and returns 503 `overloaded` as a
 *    momentary capacity guard. We retry those, never a create.
 *  - Error messages never contain the outbound URL (deliberate, per the docs),
 *    so there is no address to leak from here.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'POST', body, query } = options;
  const url = new URL(BASE_URL + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch (error) {
    clearTimeout(timer);
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new DzshipError(
      0,
      aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
      aborted ? `DzShip did not respond within ${TIMEOUT_MS}ms.` : 'Could not reach DzShip.'
    );
  }
  clearTimeout(timer);

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const envelope = payload as { error?: { code?: string; message?: string; fields?: Record<string, string> } } | null;
    const retryAfterHeader = response.headers.get('retry-after');
    throw new DzshipError(
      response.status,
      envelope?.error?.code || 'HTTP_ERROR',
      envelope?.error?.message || `DzShip returned ${response.status}.`,
      envelope?.error?.fields,
      retryAfterHeader ? Number(retryAfterHeader) : undefined
    );
  }

  return payload as T;
}

/** Retry only what is safe to retry. Never for `/v1/orders`. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!(error instanceof DzshipError) || !error.retryable || attempt === attempts - 1) throw error;
      // Honour Retry-After when present; otherwise back off fast (503 is momentary).
      const waitMs = error.retryAfter ? error.retryAfter * 1000 : 400 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

/* ------------------------------------------------------------------ *
 * Credentials
 * ------------------------------------------------------------------ */

/**
 * Builds the `credentials` block a courier needs, from server env vars.
 *
 * Per-courier shape (docs/endpoints.md). `sandbox` needs none, which is what
 * makes it usable before any merchant account exists.
 */
function buildCredentials(courier: string): Record<string, string> {
  const key = courier.toLowerCase();
  const required = (name: string, value: string | undefined): string => {
    if (!value) {
      throw new DzshipError(400, 'CONFIGURATION_ERROR', `Missing ${name} for courier "${key}".`);
    }
    return value;
  };

  // Yalidine family: same platform, same two fields, different network.
  if (['yalidine', 'yalitec', 'guepex', 'easyandspeed', 'economiqua', 'wecan'].includes(key)) {
    return {
      apiId: required('YALIDINE_API_ID', process.env.YALIDINE_API_ID),
      apiToken: required('YALIDINE_API_TOKEN', process.env.YALIDINE_API_TOKEN),
    };
  }

  if (key === 'zrexpress' || ['abexexpress', 'leopardexpress', 'colilog', 'flashdelivery'].includes(key)) {
    return {
      token: required('ZREXPRESS_TOKEN', process.env.ZREXPRESS_TOKEN),
      key: required('ZREXPRESS_KEY', process.env.ZREXPRESS_KEY),
    };
  }

  if (key === 'zrexpressnew') {
    return {
      apiKey: required('ZREXPRESS_NEW_API_KEY', process.env.ZREXPRESS_NEW_API_KEY),
      tenantId: required('ZREXPRESS_NEW_TENANT_ID', process.env.ZREXPRESS_NEW_TENANT_ID),
    };
  }

  if (key === 'maystro') {
    return { apiKey: required('MAYSTRO_API_KEY', process.env.MAYSTRO_API_KEY) };
  }

  if (key === 'noest') {
    return {
      apiToken: required('NOEST_API_TOKEN', process.env.NOEST_API_TOKEN),
      guid: required('NOEST_GUID', process.env.NOEST_GUID),
    };
  }

  if (key === 'zimou') {
    return { token: required('ZIMOU_TOKEN', process.env.ZIMOU_TOKEN) };
  }

  if (key === 'colivraison') {
    return {
      publicKey: required('COLIVRAISON_PUBLIC_KEY', process.env.COLIVRAISON_PUBLIC_KEY),
      token: required('COLIVRAISON_TOKEN', process.env.COLIVRAISON_TOKEN),
    };
  }

  if (key === 'ecomdelivery') {
    return {
      apiKey: required('ECOMDELIVERY_API_KEY', process.env.ECOMDELIVERY_API_KEY),
      apiToken: required('ECOMDELIVERY_API_TOKEN', process.env.ECOMDELIVERY_API_TOKEN),
    };
  }

  if (key === 'elogistia') {
    return { apiKey: required('ELOGISTIA_API_KEY', process.env.ELOGISTIA_API_KEY) };
  }

  if (key === 'neardelivery') {
    return {
      apiKey: required('NEARDELIVERY_API_KEY', process.env.NEARDELIVERY_API_KEY),
      apiSecret: required('NEARDELIVERY_API_SECRET', process.env.NEARDELIVERY_API_SECRET),
    };
  }

  if (key === 'mdm') {
    return { apiKey: required('MDM_API_KEY', process.env.MDM_API_KEY) };
  }

  // Generic Ecotrack fallback for a tenant without a dedicated key.
  if (key === 'ecotrack') {
    return { token: required('ECOTRACK_TOKEN', process.env.ECOTRACK_TOKEN) };
  }

  return {};
}

/**
 * Per-courier `options`.
 *
 * Yalidine family needs the origin wilaya or it cannot route or quote.
 * Generic `ecotrack` needs the tenant URL, which must be a `*.ecotrack.dz` host
 * (anything else is refused with `EGRESS_BLOCKED`).
 */
function buildOptions(courier: string): Record<string, unknown> {
  const key = courier.toLowerCase();
  const options: Record<string, unknown> = {};

  if (['yalidine', 'yalitec', 'guepex', 'easyandspeed', 'economiqua', 'wecan'].includes(key)) {
    if (!Number.isInteger(FROM_WILAYA) || FROM_WILAYA < 1 || FROM_WILAYA > 58) {
      throw new DzshipError(400, 'CONFIGURATION_ERROR', 'DZSHIP_FROM_WILAYA must be a wilaya code 1-58.');
    }
    options.fromWilaya = FROM_WILAYA;
  }

  if (key === 'ecotrack') {
    const baseUrl = process.env.ECOTRACK_BASE_URL;
    if (!baseUrl) {
      throw new DzshipError(400, 'CONFIGURATION_ERROR', 'Missing ECOTRACK_BASE_URL for courier "ecotrack".');
    }
    options.baseUrl = baseUrl;
  }

  return options;
}

/** True when this process can actually call `courier` (env vars present). */
export function isCourierConfigured(courier: string): boolean {
  const key = courier.toLowerCase();
  if (key === 'sandbox') return true;
  try {
    buildCredentials(key);
    buildOptions(key);
    return true;
  } catch {
    return false;
  }
}

export function getDefaultCourier(): string {
  return DEFAULT_COURIER.toLowerCase();
}

export function getFromWilaya(): number {
  return FROM_WILAYA;
}

/* ------------------------------------------------------------------ *
 * Endpoints
 * ------------------------------------------------------------------ */

/**
 * Delivery and return fees for a route.
 *
 * Quote, never hardcode: fees vary by courier, wilaya, commune, delivery type
 * and over time. `returnFee` matters as much as `deliveryFee` — a COD return
 * costs the fee plus the round trip, so the real economics are
 * `margin x delivered_rate - returnFee x (1 - delivered_rate)`.
 */
export async function quoteRate(query: RatesQuery, courier?: string): Promise<ShipmentQuote> {
  const key = (courier || DEFAULT_COURIER).toLowerCase();
  return withRetry(() =>
    request<ShipmentQuote>('/v1/rates', {
      body: {
        courier: key,
        credentials: buildCredentials(key),
        options: buildOptions(key),
        query: {
          ...(query.fromWilaya !== undefined ? { fromWilaya: query.fromWilaya } : {}),
          toWilaya: query.toWilaya,
          ...(query.toCommune ? { toCommune: query.toCommune } : {}),
          deliveryType: query.deliveryType,
          ...(query.tier ? { tier: query.tier } : {}),
        },
      },
    })
  );
}

/**
 * Stop desks in one wilaya, so the customer picks a pickup point instead of
 * typing an address the courier has to guess.
 *
 * Callers should cache per courier+wilaya for a day: desk lists change a few
 * times a year. `422 NOT_SUPPORTED` is expected for ZR Express and Colivraison
 * and means "this courier publishes no desk list", not "something broke".
 */
export async function getDesks(wilayaCode: number, courier?: string): Promise<StopDesk[]> {
  const key = (courier || DEFAULT_COURIER).toLowerCase();
  return withRetry(() =>
    request<StopDesk[]>('/v1/desks', {
      body: {
        courier: key,
        credentials: buildCredentials(key),
        options: buildOptions(key),
        wilayaCode,
      },
    })
  );
}

export interface CreateOrderResponse {
  trackingNumber: string;
  status: CourierStatus | string;
  reference?: string;
  labelUrl?: string;
}

/**
 * Create a parcel on the merchant's courier account.
 *
 * NOT retried, ever: a retried create is a duplicate parcel. That is why
 * `reference` is the order id — send it, and check the order doc before
 * resending, rather than relying on a retry.
 */
export async function createOrder(input: CreateShipmentInput): Promise<CreateShipmentResult> {
  const courier = input.courier.toLowerCase();

  const payload = {
    courier,
    credentials: buildCredentials(courier),
    options: buildOptions(courier),
    order: {
      // Idempotency handle: the merchant's own order id.
      reference: input.orderId,
      recipient: input.recipient,
      deliveryType: input.deliveryType,
      ...(input.deliveryType === 'stopdesk' && input.stopDeskId ? { stopDeskId: input.stopDeskId } : {}),
      productList: input.productList,
      codAmount: Math.trunc(input.codAmount),
      ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
      ...(input.declaredValue !== undefined ? { declaredValue: Math.trunc(input.declaredValue) } : {}),
      ...(input.freeShipping !== undefined ? { freeShipping: input.freeShipping } : {}),
      ...(input.isExchange !== undefined ? { isExchange: input.isExchange } : {}),
      ...(input.hasOpenPackage !== undefined ? { hasOpenPackage: input.hasOpenPackage } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    },
  };

  const response = await request<CreateOrderResponse>('/v1/orders', { body: payload });

  if (!response.trackingNumber) {
    throw new DzshipError(502, 'COURIER_ERROR', 'Courier accepted the request but returned no tracking number.');
  }

  return {
    trackingNumber: response.trackingNumber,
    status: isCourierStatus(response.status) ? response.status : 'created',
    reference: response.reference || input.orderId,
    labelUrl: response.labelUrl,
  };
}

/**
 * Status + full event history for a tracking number.
 *
 * The gateway already maps every courier onto one vocabulary and returns
 * `rawStatus` when a label falls outside it, so no per-courier mapping is
 * needed here. Keep the raw value: when a status maps to `unknown`, it is the
 * only thing support can act on.
 */
export async function trackOrder(trackingNumber: string, courier?: string): Promise<ShipmentTracking> {
  const key = (courier || DEFAULT_COURIER).toLowerCase();
  const response = await withRetry(() =>
    request<{ status?: string; rawStatus?: string; events?: Array<Record<string, unknown>> }>('/v1/track', {
      body: {
        courier: key,
        credentials: buildCredentials(key),
        options: buildOptions(key),
        trackingNumber,
      },
    })
  );

  const events: TrackingEvent[] = (response.events ?? []).map((event) => ({
    status: isCourierStatus(event.status) ? event.status : 'unknown',
    raw: typeof event.raw === 'string' ? event.raw : typeof event.rawStatus === 'string' ? event.rawStatus : undefined,
    timestamp: typeof event.timestamp === 'string' ? event.timestamp : new Date().toISOString(),
    note: typeof event.note === 'string' ? event.note : undefined,
  }));

  return {
    status: isCourierStatus(response.status) ? response.status : 'unknown',
    rawStatus: response.rawStatus,
    events,
  };
}

interface RawCourier {
  key: string;
  name?: string;
  platform?: string;
  requiredCredentials?: string[];
  capabilities?: string[];
}

/**
 * Every supported courier, flagged with whether this process can call it.
 *
 * Reference data: the gateway sends a `Cache-Control` header, so cache this
 * rather than polling it per request.
 */
export async function listCouriers(filters?: { platform?: string; q?: string }): Promise<CourierInfo[]> {
  const response = await withRetry(() =>
    request<RawCourier[] | { couriers?: RawCourier[] }>('/v1/couriers', {
      method: 'GET',
      query: { platform: filters?.platform, q: filters?.q },
    })
  );

  const raw = Array.isArray(response) ? response : response.couriers ?? [];
  return raw.map((courier) => ({
    key: courier.key,
    name: courier.name || courier.key,
    platform: courier.platform || 'unknown',
    requiredCredentials: courier.requiredCredentials ?? [],
    capabilities: courier.capabilities ?? [],
    configured: courier.key.toLowerCase() === 'sandbox' ? true : isCourierConfigured(courier.key),
    isSandbox: courier.key.toLowerCase() === 'sandbox',
  }));
}