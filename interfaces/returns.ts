export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'completed';

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId?: string;
  reason: string;
  status: ReturnStatus;
  adminNote?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface RestockRequest {
  id: string;
  articleId: string;
  contact: string;
  createdAt: string;
  notified: boolean;
}

export interface InventoryLog {
  id: string;
  articleId: string;
  change: number;
  reason: string;
  by?: string;
  at: string;
}

export interface InventorySettings {
  lowThreshold: number;
  hideOutOfStock: boolean;
}

export const DEFAULT_INVENTORY: InventorySettings = {
  lowThreshold: 5,
  hideOutOfStock: false,
};
