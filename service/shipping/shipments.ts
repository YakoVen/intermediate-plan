import { db } from '@/service/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Order } from '@/interfaces/order';
import type { CourierStatus } from '@/interfaces/shipment';
import {
  isCourierStatus,
  mapStatusToState,
  isTerminalStatus,
} from '@/service/shipping/status-map';

/**
 * Shipment writes against the `orders` collection.
 *
 * Deliberately separate from `database.ts`: that file is the general data
 * layer, this one owns the DzShip field lifecycle and the invariants that go
 * with it (never double-ship, never book revenue before `delivered`, stop
 * polling terminal parcels).
 */

/** Fields written once at parcel creation. */
export interface ShipmentRecord {
  trackingNumber: string;
  courier: string;
  courierStatus: CourierStatus;
  rawStatus?: string;
  labelUrl?: string;
  stopDeskId?: string;
  stopDeskName?: string;
  wilayaCode: number;
  wilayaShipCode: number;
  communeName: string;
  codAmount: number;
  quotedDeliveryFee?: number;
  returnFee?: number;
  hasOpenPackage?: boolean;
  freeShipping?: boolean;
  shippedAt: string;
}

/** Fields written on every tracking sync. */
export interface TrackingSyncRecord {
  courierStatus: CourierStatus;
  rawStatus?: string;
  state: number;
  lastTrackedAt: string;
  /** Only set on the first sync that produced each distinct status. */
  newEvent?: { status: CourierStatus; raw?: string; timestamp: string };
}

/**
 * An order is shippable when it is a real order (not a failed capture), the
 * merchant has confirmed it, and it has no parcel yet.
 *
 * Confirmation is the gate on purpose. In COD the customer commits nothing at
 * checkout, so the confirm call is the strongest lever on delivered rate that
 * exists; shipping first just earns return fees (docs/cash-on-delivery.md).
 */
export function canShip(order: Order): { ok: boolean; reason?: string } {
  if (order.type === 'failed') return { ok: false, reason: 'Commande echouee.' };
  if (order.trackingNumber) return { ok: false, reason: 'Deja expediee.' };
  if (!order.confirmedAt) return { ok: false, reason: 'Commande non confirmee. Confirmez-la d\'abord.' };
  if (!order.phone || !order.communeName) return { ok: false, reason: 'Adresse incomplete.' };
  return { ok: true };
}

/**
 * Attach a parcel to an order.
 *
 * Refuses to overwrite an existing `trackingNumber` — a second create call is a
 * duplicate parcel, and the courier would not know that. The caller is expected
 * to have checked `canShip` first; this is the backstop.
 */
export async function saveShipment(orderId: string, record: ShipmentRecord): Promise<void> {
  const ref = doc(db, 'orders', orderId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) throw new Error(`Order ${orderId} not found.`);
  const existing = snapshot.data() as Order;
  if (existing.trackingNumber) {
    throw new Error(`Order ${orderId} already has tracking number ${existing.trackingNumber}.`);
  }

  const now = new Date().toISOString();
  await updateDoc(ref, {
    ...record,
    state: mapStatusToState(record.courierStatus),
    lastTrackedAt: now,
    trackingHistory: [
      ...(existing.trackingHistory ?? []),
      { status: record.courierStatus, raw: record.rawStatus, timestamp: now, note: 'Parcelle cree' },
    ],
  });
}

/** Mark the order confirmed, which is what makes it shippable. */
export async function confirmOrder(orderId: string, by?: string): Promise<void> {
  const ref = doc(db, 'orders', orderId);
  await updateDoc(ref, {
    confirmedAt: new Date().toISOString(),
    ...(by ? { confirmedBy: by } : {}),
  });
}

/**
 * Apply a tracking result.
 *
 * Appends to `trackingHistory` only when the status actually changed, so the
 * admin timeline stays readable across many syncs. `state` is always
 * re-derived so a stale manual override cannot survive a courier update.
 */
export async function applyTrackingSync(orderId: string, sync: TrackingSyncRecord): Promise<void> {
  const ref = doc(db, 'orders', orderId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return;

  const order = snapshot.data() as Order;
  const changed = order.courierStatus !== sync.courierStatus;

  await updateDoc(ref, {
    courierStatus: sync.courierStatus,
    rawStatus: sync.rawStatus ?? order.rawStatus ?? null,
    state: sync.state,
    lastTrackedAt: sync.lastTrackedAt,
    ...(changed && sync.newEvent
      ? { trackingHistory: [...(order.trackingHistory ?? []), sync.newEvent] }
      : {}),
  });
}

/**
 * Orders a tracking sync should still poll: has a parcel, not yet terminal.
 * The sync cron calls this and `isTerminalStatus` gates the rest.
 */
export function needsTracking(order: Order): boolean {
  return !!order.trackingNumber && !isTerminalStatus(order.courierStatus);
}

/**
 * Reconciliation fields written at quote time so the money stops moving under
 * the order. Delivery fee and return fee are captured once, at creation.
 */
export async function saveQuoteSnapshot(
  orderId: string,
  snapshot: { deliveryFee: number; returnFee?: number }
): Promise<void> {
  const ref = doc(db, 'orders', orderId);
  await updateDoc(ref, {
    deliveryFee: snapshot.deliveryFee,
    quotedDeliveryFee: snapshot.deliveryFee,
    ...(snapshot.returnFee !== undefined ? { returnFee: snapshot.returnFee } : {}),
  });
}

/** Normalize an untrusted status string before it reaches Firestore. */
export function coerceStatus(value: unknown): CourierStatus {
  return isCourierStatus(value) ? value : 'unknown';
}