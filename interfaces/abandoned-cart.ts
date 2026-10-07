export interface AbandonedCart {
  id: string;
  sessionId: string;
  items: import('./order').CartItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  wilaya?: string;
  subtotal: number;
  status: 'active' | 'recovered' | 'resolved';
  createdAt: string;
  abandonedAt: string;
  recoverySmsSentAt?: string;
  recoveryEmailSentAt?: string;
}
