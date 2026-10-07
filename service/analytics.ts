import { Order } from '../interfaces/order';

export interface DayPoint {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface TopSeller {
  articleId: string;
  title: string;
  quantity: number;
  revenue: number;
}

export interface WilayaStat {
  wilaya: string;
  orders: number;
  revenue: number;
}

/** Only completed sales count — failed recovery entries are excluded. */
export function salesOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.type !== 'failed');
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function revenueByDay(orders: Order[], days: number): DayPoint[] {
  const sales = salesOrders(orders);
  const points: DayPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = dayKey(d);
    const label = d.toLocaleDateString('fr-DZ', { day: '2-digit', month: '2-digit' });
    const dayOrders = sales.filter((o) => o.date && o.date.slice(0, 10) === key);
    points.push({
      key,
      label,
      revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
      orders: dayOrders.length,
    });
  }
  return points;
}

export function topSellers(orders: Order[], limit = 5): TopSeller[] {
  const map = new Map<string, TopSeller>();
  for (const o of salesOrders(orders)) {
    for (const item of o.items || []) {
      const cur = map.get(item.articleId) || { articleId: item.articleId, title: item.title, quantity: 0, revenue: 0 };
      cur.quantity += item.quantity;
      cur.revenue += item.price * item.quantity;
      map.set(item.articleId, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function averageOrderValue(orders: Order[]): number {
  const sales = salesOrders(orders);
  if (sales.length === 0) return 0;
  return Math.round(sales.reduce((s, o) => s + (o.total || 0), 0) / sales.length);
}

export function ordersByWilaya(orders: Order[]): WilayaStat[] {
  const map = new Map<string, WilayaStat>();
  for (const o of salesOrders(orders)) {
    const key = o.wilaya || 'Inconnue';
    const cur = map.get(key) || { wilaya: key, orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += o.total || 0;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function statusCounts(orders: Order[]): { pending: number; confirmed: number; shipped: number; delivered: number } {
  const sales = salesOrders(orders);
  return {
    pending: sales.filter((o) => o.state === 0).length,
    confirmed: sales.filter((o) => o.state === 1).length,
    shipped: sales.filter((o) => o.state === 2).length,
    delivered: sales.filter((o) => o.state === 3).length,
  };
}

export function totalRevenue(orders: Order[]): number {
  return salesOrders(orders).reduce((s, o) => s + (o.total || 0), 0);
}
