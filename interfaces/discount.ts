export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  minOrderAmount?: number;
  categoryIndex?: number;
  productId?: string;
  usageLimit?: number;
  usageCount: number;
  stackable: boolean;
  createdAt: string;
}
