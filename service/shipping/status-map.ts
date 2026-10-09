import type { CourierStatus } from '@/interfaces/shipment';

/**
 * Mapping between DzShip's 14 canonical statuses and the app's 4-state
 * `order_states` (0=En attente, 1=Confirmée, 2=Expédiée, 3=Livrée).
 *
 * `state` is what the admin table renders and what `updateOrderState` writes.
 * `courierStatus` on the order doc is the source of truth; `state` is derived.
 */

export const COURIER_STATUSES: CourierStatus[] = [
  'created',
  'pending_pickup',
  'picked_up',
  'in_transit',
  'at_hub',
  'out_for_delivery',
  'delivery_attempted',
  'delivered',
  'on_hold',
  'return_in_transit',
  'returned',
  'cancelled',
  'lost',
  'unknown',
];

/**
 * Terminal statuses. Nothing further is expected, so a tracking sync can stop
 * polling them (docs/statuses.md: delivered, returned, cancelled, lost).
 */
export const TERMINAL_STATUSES: CourierStatus[] = [
  'delivered',
  'returned',
  'cancelled',
  'lost',
];

/**
 * Statuses that mean the parcel is still moving and the customer may still
 * receive it. Anything not in here and not terminal is effectively stalled.
 */
export const MOVING_STATUSES: CourierStatus[] = [
  'created',
  'pending_pickup',
  'picked_up',
  'in_transit',
  'at_hub',
  'out_for_delivery',
];

export const STATUS_TO_STATE: Record<CourierStatus, number> = {
  created: 0,
  pending_pickup: 0,
  picked_up: 1,
  in_transit: 2,
  at_hub: 2,
  out_for_delivery: 2,
  // Worth recovering, not finished. Kept at "shipped" so the admin sees it as live.
  delivery_attempted: 2,
  delivered: 3,
  // Stalled / returning: still an open order from the merchant's side.
  on_hold: 2,
  return_in_transit: 2,
  // Terminal but NOT revenue. Kept at 3 so it stops showing as in-flight;
  // revenue logic must check courierStatus, not state.
  returned: 3,
  cancelled: 3,
  lost: 3,
  unknown: 2,
};

/** FR + AR labels, ready to render. Arabic needs a `dir="rtl"` context. */
export const STATUS_LABELS: Record<CourierStatus, { fr: string; ar: string }> = {
  created: { fr: 'Enregistré', ar: 'تم التسجيل' },
  pending_pickup: { fr: 'En attente de ramassage', ar: 'في انتظار الاستلام' },
  picked_up: { fr: 'Ramassé', ar: 'تم الاستلام من المتجر' },
  in_transit: { fr: 'En transit', ar: 'قيد النقل' },
  at_hub: { fr: 'Au centre de tri', ar: 'في مركز الفرز' },
  out_for_delivery: { fr: 'En cours de livraison', ar: 'خرج للتوصيل' },
  delivery_attempted: { fr: 'Tentative de livraison', ar: 'محاولة تسليم' },
  delivered: { fr: 'Livré', ar: 'تم التسليم' },
  on_hold: { fr: 'En attente', ar: 'معلّق' },
  return_in_transit: { fr: 'Retour en cours', ar: 'الإرجاع قيد النقل' },
  returned: { fr: 'Retourné', ar: 'تم الإرجاع' },
  cancelled: { fr: 'Annulé', ar: 'ملغى' },
  lost: { fr: 'Perdu', ar: 'مفقود' },
  unknown: { fr: 'Statut inconnu', ar: 'حالة غير معروفة' },
};

/**
 * Tone hint for UI colouring. `delivery_attempted` is deliberately `warning`,
 * not `success` — it is the single highest-value status to act on
 * (docs/statuses.md: call within the hour or the parcel comes back).
 */
export const STATUS_TONES: Record<CourierStatus, 'neutral' | 'info' | 'active' | 'warning' | 'success' | 'danger'> = {
  created: 'neutral',
  pending_pickup: 'neutral',
  picked_up: 'info',
  in_transit: 'info',
  at_hub: 'info',
  out_for_delivery: 'active',
  delivery_attempted: 'warning',
  delivered: 'success',
  on_hold: 'warning',
  return_in_transit: 'warning',
  returned: 'danger',
  cancelled: 'danger',
  lost: 'danger',
  unknown: 'neutral',
};

/** Pipeline shown on the public tracking page, in order. */
export const TRACKING_PIPELINE: CourierStatus[] = [
  'created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

export function isCourierStatus(value: unknown): value is CourierStatus {
  return typeof value === 'string' && (COURIER_STATUSES as string[]).includes(value);
}

export function isTerminalStatus(status?: CourierStatus | string | null): boolean {
  return !!status && (TERMINAL_STATUSES as string[]).includes(status);
}

/** Only `delivered` books revenue (docs/cash-on-delivery.md). */
export function isDelivered(status?: CourierStatus | string | null): boolean {
  return status === 'delivered';
}

/** A returned or lost parcel is negative margin, not zero. */
export function isNegativeOutcome(status?: CourierStatus | string | null): boolean {
  return status === 'returned' || status === 'lost' || status === 'cancelled';
}

/** Derive the 0-3 admin state. Unknown input falls back to "En attente". */
export function mapStatusToState(status?: CourierStatus | string | null): number {
  if (!status) return 0;
  if (isCourierStatus(status)) return STATUS_TO_STATE[status];
  return 0;
}

export function getStatusLabel(status?: CourierStatus | string | null): { fr: string; ar: string } {
  if (status && isCourierStatus(status)) return STATUS_LABELS[status];
  return STATUS_LABELS.unknown;
}

export function getStatusTone(status?: CourierStatus | string | null) {
  if (status && isCourierStatus(status)) return STATUS_TONES[status];
  return STATUS_TONES.unknown;
}

/** Index within the display pipeline; -1 for statuses off the happy path. */
export function pipelineIndex(status?: CourierStatus | string | null): number {
  if (!status || !isCourierStatus(status)) return -1;
  return TRACKING_PIPELINE.indexOf(status);
}