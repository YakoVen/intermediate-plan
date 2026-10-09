'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Filter, Mail, CheckCircle } from 'lucide-react';
import { AbandonedCart } from '@/interfaces/abandoned-cart';
import { getAbandonedCarts, updateAbandonedCart, updateAbandonedCartStatus } from '@/service/firebase/database';
import toast from 'react-hot-toast';

type FilterKey = 'all' | AbandonedCart['status'];

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setCarts(await getAbandonedCarts());
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? carts : carts.filter((c) => c.status === filter);
  const active = carts.filter((c) => c.status === 'active');
  const recovered = carts.filter((c) => c.status === 'recovered').length;
  const recoveryRate = carts.length > 0 ? Math.round((recovered / carts.length) * 100) : 0;

  async function handleRecovered(id: string) {
    try {
      await updateAbandonedCartStatus(id, 'recovered');
      setCarts((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'recovered' as const } : c)));
      toast.success('Panier marqué récupéré');
    } catch {
      toast.error('Erreur de mise à jour');
    }
  }

  async function handleResolve(id: string) {
    try {
      await updateAbandonedCartStatus(id, 'resolved');
      setCarts((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'resolved' as const } : c)));
      toast.success('Panier marqué résolu');
    } catch {
      toast.error('Erreur de mise à jour');
    }
  }

  async function handleNudge(id: string, channel: 'sms' | 'email') {
    const cart = carts.find((c) => c.id === id);
    if (!cart) return;
    const contact = channel === 'sms' ? cart.customerPhone : cart.customerEmail;
    if (!contact) {
      toast.error(`Aucun ${channel === 'sms' ? 'téléphone' : 'email'} pour ce panier`);
      return;
    }
    setSending(id + channel);
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: channel === 'sms' ? 'abandoned_sms' : 'abandoned_email',
          data: { contact, subtotal: cart.subtotal, items: cart.items, sessionId: cart.sessionId },
        }),
      });
      const now = new Date().toISOString();
      await updateAbandonedCart(id, channel === 'sms' ? { recoverySmsSentAt: now } : { recoveryEmailSentAt: now });
      setCarts((prev) => prev.map((c) => (c.id === id
        ? { ...c, ...(channel === 'sms' ? { recoverySmsSentAt: now } : { recoveryEmailSentAt: now }) }
        : c)));
      toast.success(channel === 'sms' ? 'Relance SMS envoyée' : 'Email de relance envoyé');
    } catch {
      toast.error("Erreur d'envoi");
    } finally {
      setSending(null);
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Paniers abandonnés</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Actifs à relancer</p>
            <p className="text-2xl font-bold">{active.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Valeur potentielle</p>
            <p className="text-2xl font-bold">{active.reduce((s, c) => s + (c.subtotal || 0), 0).toLocaleString()} DA</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Taux de récupération</p>
            <p className="text-2xl font-bold">{recoveryRate}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex gap-4 bg-gray-50/50">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="pl-10 pr-8 py-2 border rounded-lg text-sm bg-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterKey)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif (à relancer)</option>
              <option value="recovered">Récupéré</option>
              <option value="resolved">Résolu</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="p-4 font-medium">Client / Date</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Articles</th>
                <th className="p-4 font-medium">Valeur</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((cart) => (
                <tr key={cart.id} className="text-sm hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">{cart.customerName || 'Client anonyme'}</div>
                    <div className="text-gray-500 text-xs">{cart.abandonedAt ? cart.abandonedAt.slice(0, 16).replace('T', ' ') : ''}</div>
                    {(cart.recoverySmsSentAt || cart.recoveryEmailSentAt) && (
                      <div className="text-xs text-indigo-600">Relancé{cart.recoverySmsSentAt ? ' SMS' : ''}{cart.recoveryEmailSentAt ? ' + email' : ''}</div>
                    )}
                  </td>
                  <td className="p-4 text-gray-600">{cart.customerPhone || cart.customerEmail || '—'}</td>
                  <td className="p-4 text-gray-600" title={(cart.items || []).map((i) => `${i.quantity}x ${i.title}`).join(', ')}>
                    {(cart.items || []).reduce((s, i) => s + i.quantity, 0)} article(s)
                  </td>
                  <td className="p-4 font-medium">{(cart.subtotal || 0).toLocaleString()} DA</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      cart.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                      cart.status === 'recovered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {cart.status === 'active' ? 'À relancer' : cart.status === 'recovered' ? 'Récupéré' : 'Résolu'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {cart.status === 'active' && (
                      <div className="flex gap-2 justify-end">
                        {cart.customerPhone && (
                          <button onClick={() => handleNudge(cart.id, 'sms')} disabled={sending === cart.id + 'sms'}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50">
                            <Phone size={14} /> SMS
                          </button>
                        )}
                        {cart.customerEmail && (
                          <button onClick={() => handleNudge(cart.id, 'email')} disabled={sending === cart.id + 'email'}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50">
                            <Mail size={14} /> Email
                          </button>
                        )}
                        <button onClick={() => handleRecovered(cart.id)}
                          className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium">
                          Récupéré
                        </button>
                        <button onClick={() => handleResolve(cart.id)}
                          className="px-3 py-1.5 border text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium">
                          Résolu
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Aucun panier. Les paniers sont capturés automatiquement au checkout.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
