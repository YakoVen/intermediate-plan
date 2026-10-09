/**
 * DzShip shipping types.
 *
 * Field naming note: the vendored dataset in `service/shipping/data/` uses
 * `name` / `nameAr` (dzship repo files), while the live hosted API
 * (`GET /v1/wilayas`, `GET /v1/communes`) returns `nameFr` / `nameAr`.
 * The read helpers in `service/shipping/wilaya-data.ts` normalize both into
 * the `nameFr` field used across the app, so callers never see the difference.
 */

/** Canonical DzShip status vocabulary (docs/statuses.md, closed set of 14). */
export type CourierStatus =
  | 'created'
  | 'pending_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'at_hub'
  | 'out_for_delivery'
  | 'delivery_attempted'
  | 'delivered'
  | 'on_hold'
  | 'return_in_transit'
  | 'returned'
  | 'cancelled'
  | 'lost'
  | 'unknown';

export type DeliveryType = 'home' | 'stopdesk';

/** DzShip `deliveryType` values. App-facing type stays `home | desk`. */
export const DZSHIP_DELIVERY_TYPE: Record<'home' | 'desk', DeliveryType> = {
  home: 'home',
  desk: 'stopdesk',
};

export interface WilayaInfo {
  code: number;
  nameFr: string;
  nameAr: string;
  nameAscii: string;
  communeCount: number;
  /** 2026 division only: false for the 11 new wilayas (59-69). */
  courierSupported?: boolean;
  /** 2026 division only: the code couriers still expect (e.g. 68 -> 28). */
  shipAs?: number;
  shipAsName?: string;
  /** Derived locally; reconcile against live `isDeepSouth` from the API. */
  isDeepSouth?: boolean;
}

export interface CommuneInfo {
  wilayaCode: number;
  /** Courier spelling (French). This is what gets sent to the courier. */
  nameFr: string;
  nameAr: string;
  /** Journal Officiel spelling, when it differs from the courier's. */
  gazetteName?: string;
}

export interface StopDesk {
  id: string;
  name: string;
  wilayaCode: number;
  communeName: string;
  address: string;
}

export interface ShipmentQuote {
  deliveryFee: number;
  returnFee: number;
  total: number;
  currency: string;
}

export interface ShipmentRecipient {
  fullName: string;
  phone: string;
  phoneAlt?: string;
  /** Always the courier-accepted code: 1-58, or the `shipAs` code for 59-69. */
  wilayaCode: number;
  /** Courier spelling from the vendored commune list. */
  communeName: string;
  /** Required for home delivery. */
  addressLine?: string;
}

export interface CreateShipmentInput {
  /** Firestore order id. Doubles as the idempotency handle. */
  orderId: string;
  courier: string;
  recipient: ShipmentRecipient;
  deliveryType: DeliveryType;
  /** Required for stopdesk. Some couriers route by commune instead. */
  stopDeskId?: string;
  /** Human-readable parcel contents. DzShip truncates to the courier limit. */
  productList: string;
  /** Integer DZD collected by the driver. 0 for a prepaid parcel. */
  codAmount: number;
  weightKg?: number;
  declaredValue?: number;
  /** Set true when the merchant absorbs the delivery fee. */
  freeShipping?: boolean;
  isExchange?: boolean;
  hasOpenPackage?: boolean;
  notes?: string;
}

export interface CreateShipmentResult {
  trackingNumber: string;
  status: CourierStatus;
  reference: string;
  labelUrl?: string;
}

export interface TrackingEvent {
  status: CourierStatus;
  raw?: string;
  timestamp: string;
  note?: string;
}

export interface ShipmentTracking {
  status: CourierStatus;
  rawStatus?: string;
  /** Oldest first. */
  events: TrackingEvent[];
}

export interface CourierInfo {
  key: string;
  name: string;
  platform: string;
  requiredCredentials: string[];
  capabilities: string[];
  /** True when this process has the env vars to call it. */
  configured: boolean;
  /** True when `sandbox`, which needs no credentials and creates nothing. */
  isSandbox?: boolean;
}

export interface RatesQuery {
  fromWilaya?: number;
  toWilaya: number;
  toCommune?: string;
  deliveryType: DeliveryType;
  tier?: 'express' | 'economic';
}

/** One envelope everywhere (docs/endpoints.md). */
export interface DzshipErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}