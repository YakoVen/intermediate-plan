'use client';

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, ShoppingCart, Calculator, Trophy } from 'lucide-react';
import { getOrders, getArticles } from '@/service/firebase/database';
import { Order } from '@/interfaces/order';
import { revenueByDay, topSellers, averageOrderValue, ordersByWilaya, statusCounts, totalRevenue, DayPoint } from '@/service/analytics';
import toast from 'react-hot-toast';

function AreaChart({ data, color }: { data: DayPoint[]; color: string }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const w = 600;
  const h = 180;
  const pad = 8;
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (d.revenue / max) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `${pad},${h - pad} ${pts.join(' ')} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44">
      <polygon points={area} fill={color} opacity={0.15} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={d.key} cx={pad + i * stepX} cy={h - pad - (d.revenue / max) * (h - pad * 2)} r={3} fill={color}>
          <title>{`${d.label}: ${d.revenue.toLocaleString()} DA`}</title>
        </circle>
      ))}
    </svg>
  );
}

function BarChart({ data, color }: { data: DayPoint[]; color: string }) {
  const max = Math.max(...data.map((d) => d.orders), 1);
  return (
    <div className="flex items-end gap-1 h-44">
      {data.map((d) => (
        <div key={d.key} className="flex-1 flex flex-col justify-end h-full" title={`${d.label}: ${d.orders} commandes`}>
          <div className="rounded-t" style={{ height: `${Math.max((d.orders / max) * 100, d.orders > 0 ? 4 : 0)}%`, backgroundColor: color }} />
          {data.length <= 14 && <span className="text-[10px] text-gray-400 text-center mt-1 truncate">{d.label}</span>}
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeProducts, setActiveProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    async function load() {
      try {
        const [o, a] = await Promise.all([getOrders(), getArticles({ active: true })]);
        setOrders(o);
        setActiveProducts(a.length);
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const series = useMemo(() => revenueByDay(orders, days), [orders, days]);
  const sellers = useMemo(() => topSellers(orders, 5), [orders]);
  const wilayas = useMemo(() => ordersByWilaya(orders), [orders]);
  const statuses = useMemo(() => statusCounts(orders), [orders]);
  const revenue = useMemo(() => totalRevenue(orders), [orders]);
  const aov = useMemo(() => averageOrderValue(orders), [orders]);

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  const kpis = [
    { name: 'Revenu total', value: `${revenue.toLocaleString()} DA`, icon: DollarSign, bg: 'bg-green-100', color: 'text-green-600' },
    { name: 'Commandes', value: orders.filter((o) => o.type !== 'failed').length, icon: ShoppingCart, bg: 'bg-indigo-100', color: 'text-indigo-600' },
    { name: 'Panier moyen', value: `${aov.toLocaleString()} DA`, icon: Calculator, bg: 'bg-blue-100', color: 'text-blue-600' },
    { name: 'Produits actifs', value: activeProducts, icon: Trophy, bg: 'bg-amber-100', color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Analytique</h1>
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${days === d ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {d} jours
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.name} className="bg-white rounded-xl border p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${k.bg}`}><k.icon className={`w-6 h-6 ${k.color}`} /></div>
            <div>
              <p className="text-sm text-gray-500">{k.name}</p>
              <p className="text-xl font-bold">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-1">Revenu ({days} jours)</h2>
          <p className="text-sm text-gray-500 mb-4">Total: {series.reduce((s, d) => s + d.revenue, 0).toLocaleString()} DA</p>
          <AreaChart data={series} color="#4f46e5" />
        </div>
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-1">Commandes ({days} jours)</h2>
          <p className="text-sm text-gray-500 mb-4">En attente: {statuses.pending} • Livrées: {statuses.delivered}</p>
          <BarChart data={series} color="#10b981" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border overflow-hidden">
          <h2 className="font-bold p-6 pb-2">Meilleures ventes</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {sellers.map((s, i) => (
                <tr key={s.articleId} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-bold text-gray-400">#{i + 1}</td>
                  <td className="px-2 py-3 font-medium truncate max-w-[180px]">{s.title}</td>
                  <td className="px-2 py-3 text-gray-500">{s.quantity} vendus</td>
                  <td className="px-6 py-3 text-right font-bold">{s.revenue.toLocaleString()} DA</td>
                </tr>
              ))}
              {sellers.length === 0 && <tr><td className="px-6 py-8 text-center text-gray-500">Aucune vente pour le moment.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <h2 className="font-bold p-6 pb-2">Commandes par wilaya</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {wilayas.slice(0, 8).map((w) => (
                <tr key={w.wilaya} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{w.wilaya}</td>
                  <td className="px-2 py-3 text-gray-500">{w.orders} commandes</td>
                  <td className="px-6 py-3 text-right font-bold">{w.revenue.toLocaleString()} DA</td>
                </tr>
              ))}
              {wilayas.length === 0 && <tr><td className="px-6 py-8 text-center text-gray-500">Aucune commande pour le moment.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
