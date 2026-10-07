export interface CartItem {
  articleId: string;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
}

export interface TrackingEntry {
  status: number;
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
}
