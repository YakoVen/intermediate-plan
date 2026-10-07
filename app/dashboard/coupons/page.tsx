'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import AvailableButton from '@/components/dashboard/widget/available-button';
import { Coupon } from '@/interfaces/coupon';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/service/firebase/database';
import toast from 'react-hot-toast';

const emptyForm = { code: '', type: 'percentage' as Coupon['type'], value: 10, usageLimit: 0, minOrderAmount: 0, expiresAt: '', active: true };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setCoupons(await getCoupons());
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  const openModal = (coupon: Coupon | null = null) => {
    if (coupon) {
      setEditingId(coupon.id);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        usageLimit: coupon.usageLimit,
        minOrderAmount: coupon.minOrderAmount ?? 0,
        expiresAt: coupon.expiresAt ?? '',
        active: coupon.active,
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code.trim() || formData.value <= 0) {
      toast.error('Code et valeur requis');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        active: formData.active,
        usageLimit: Number(formData.usageLimit) || 0,
        usageCount: 0,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        expiresAt: formData.expiresAt || undefined,
      };
      if (editingId) {
        await updateCoupon(editingId, payload);
        toast.success('Coupon mis a jour');
      } else {
        await createCoupon(payload);
        toast.success('Coupon cree');
      }
      setIsModalOpen(false);
      await load();
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(c: Coupon) {
    try {
      await updateCoupon(c.id, { active: !c.active });
      await load();
    } catch {
      toast.error('Erreur de mise a jour');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce coupon ?')) return;
    try {
      await deleteCoupon(id);
      await load();
      toast.success('Coupon supprime');
    } catch {
      toast.error('Erreur de suppression');
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Coupons promo</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700">
          <Plus size={18} /> Nouveau coupon
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Reduction</th>
              <th className="px-4 py-3">Utilisations</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                <td className="px-4 py-3">{c.type === 'percentage' ? `${c.value}%` : `${c.value} DA`}</td>
                <td className="px-4 py-3 text-gray-500">{c.usageCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}</td>
                <td className="px-4 py-3"><AvailableButton isActive={c.active} onClick={() => handleToggle(c)} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openModal(c)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Aucun coupon. Creez-en un pour demarrer.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingId ? 'Modifier' : 'Nouveau'} coupon</h2>
              <button type="button" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full border rounded-xl px-3 py-2 uppercase" placeholder="PROMO20" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as Coupon['type'] })}
                  className="w-full border rounded-xl px-3 py-2 bg-white">
                  <option value="percentage">% Pourcentage</option>
                  <option value="fixed">DA Fixe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valeur</label>
                <input type="number" min={1} value={formData.value} onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Limite (0 = ∞)</label>
                <input type="number" min={0} value={formData.usageLimit} onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min commande</label>
                <input type="number" min={0} value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expire le</label>
              <input type="date" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full border rounded-xl px-3 py-2" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded text-indigo-600" /> Actif
            </label>
            <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
