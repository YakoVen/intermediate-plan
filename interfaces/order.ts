export interface CartItem {
  articleId: string;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
}

import type { CourierStatus } from '@/interfaces/shipment';

export interface TrackingEntry {
  /**
   * Canonical DzShip status (one of 14 strings) once an order has a parcel.
   * Legacy manual entries written before the DzShip integration used a number
   * 0-3 matching `order_states`; those still read fine as long as callers treat
   * the field loosely. New writes always use the string vocabulary.
   */
  status: string | number;
  /** Courier's original wording, when it fell outside the known vocabulary. */
  raw?: string;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  date: string;
  name: string;
  phone: string;
  email?: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  discountId?: string;
  loyaltyDiscount?: number;
  loyaltyPointsUsed?: number;
  loyaltyEarned?: number;
  total: number;
  address: string;
  wilaya: string;
  commune: string;
  deliveryMethod: 'home' | 'desk';
  state: number;
  trackingHistory?: TrackingEntry[];
  trackingNote?: string;
  type?: 'order' | 'failed';
  failureReason?: string;

  /* --- DzShip shipping fields (optional: set once the order is shipped) --- */

  /** What the customer picked (1-69). */
  wilayaCode?: number;
  /** What the courier receives (1-58, or the `shipAs` code for 59-69). */
  wilayaShipCode?: number;
  /** Courier spelling of the commune. `commune` above stays the display value. */
  communeName?: string;
  /** Second number the courier may call. */
  phoneAlt?: string;
  /** Courier key, e.g. `yalidine`, `zrexpress`, `dhd`, `sandbox`. */
  courier?: string;
  /** Parcel id from the courier. Present once shipped. */
  trackingNumber?: string;
  /** Canonical status; source of truth for `state` and for revenue. */
  courierStatus?: CourierStatus;
  /** Courier's own wording, kept for support. */
  rawStatus?: string;
  /** Printable label (Yalidine / Maystro / NOEST / Ecotrack). */
  labelUrl?: string;
  /** Stop-desk id when `deliveryMethod === 'desk'`. */
  stopDeskId?: string;
  stopDeskName?: string;
  /** What the driver collects. Integer DZD. */
  codAmount?: number;
  /** Delivery fee captured at quote time — quotes change, accounting should not. */
  quotedDeliveryFee?: number;
  /** Captured at quote time. A returned parcel costs this plus handling. */
  returnFee?: number;
  /** Set once the merchant confirms the order (by phone/WhatsApp). */
  confirmedAt?: string;
  confirmedBy?: string;
  /** When the parcel was actually created on the courier account. */
  shippedAt?: string;
  /** Set when the customer asked to open the parcel before paying. */
  hasOpenPackage?: boolean;
  /** True when the merchant absorbs the delivery fee. */
  freeShipping?: boolean;
  /** Last tracking sync attempt, for a sync cron to resume from. */
  lastTrackedAt?: string;
}
