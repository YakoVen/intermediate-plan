export interface Bundle {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  productIds: string[];
  bundlePrice: number;
  active: boolean;
  createdAt: string;
}
