export interface Variant {
  id: string;
  name: string;
  type: string;
  color?: string;
  size?: string;
  material?: string;
  stock: number;
  price?: number;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  screenshots: string[];
  price: number;
  originalPrice?: number;
  oldPrice?: number;
  category: number;
  active: boolean;
  rating?: number;
  ratingsCount?: number;
  salesCount?: number;
  variants?: Variant[];
  hasVariants?: boolean;
  totalStock?: number;
  createdAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  collection?: string;
  brand?: string;
}
