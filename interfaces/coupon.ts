export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  active: boolean;
  usageLimit: number;
  usageCount: number;
  expiresAt?: string;
  minOrderAmount?: number;
}
