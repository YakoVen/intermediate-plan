export interface FlashSale {
  id: string;
  name: string;
  productIds: string[];
  discountType: 'percentage' | 'fixed';
  value: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  bannerText?: string;
  createdAt: string;
}
