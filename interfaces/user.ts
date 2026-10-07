export interface UserAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  role: 'customer' | 'admin';
  addresses?: UserAddress[];
  wishlist?: string[];
  createdAt: string;
  updatedAt?: string;
}
