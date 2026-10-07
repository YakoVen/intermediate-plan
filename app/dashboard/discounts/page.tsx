'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import AvailableButton from '@/components/dashboard/widget/available-button';
import { Discount } from '@/interfaces/discount';
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from '@/service/firebase/database';
import toast from 'react-hot-toast';

const emptyForm = { name: '', type: 'percentage' as Discount['type'], value: 10, minOrderAmount: 0, usageLimit: 0, active: true };

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setDiscounts(await getDiscounts());
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  const openModal = (d: Discount | null = null) => {
    if (d) {
      setEditingId(d.id);
      setFormData({
        name: d.name,
        type: d.type,
        value: d.value,
        minOrderAmount: d.minOrderAmount ?? 0,
        usageLimit: d.usageLimit ?? 0,
        active: d.active,
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || formData.value <= 0) {
      toast.error('Nom et valeur requis');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        value: Number(formData.value),
        active: formData.active,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        usageLimit: Number(formData.usageLimit) || 0,
        usageCount: 0,
        stackable: false,
        createdAt: new Date().toISOString(),
      };
      if (editingId) {
        await updateDiscount(editingId, payload);
        toast.success('Remise mise a jour');
      } else {
        await createDiscount(payload);
        toast.success('Remise creee');
      }
      setIsModalOpen(false);
      await load();
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(d: Discount) {
    try {
      await updateDiscount(d.id, { active: !d.active });
      await load();
    } catch {
      toast.error('Erreur de mise a jour');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette remise ?')) return;
    try {
      await deleteDiscount(id);
      await load();
      toast.success('Remise supprimee');
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
        <h1 className="text-2xl font-bold">Remises automatiques</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700">
          <Plus size={18} /> Nouvelle remise
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Reduction</th>
              <th className="px-4 py-3">Min commande</th>
              <th className="px-4 py-3">Utilisations</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {discounts.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3">
                  {d.type === 'percentage' ? `${d.value}%` : d.type === 'fixed' ? `${d.value} DA` : 'Livraison offerte'}
                </td>
                <td className="px-4 py-3 text-gray-500">{d.minOrderAmount ? `${d.minOrderAmount} DA` : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{d.usageCount}{d.usageLimit ? ` / ${d.usageLimit}` : ''}</td>
                <td className="px-4 py-3"><AvailableButton isActive={d.active} onClick={() => handleToggle(d)} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openModal(d)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {discounts.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune remise. Creez-en une pour demarrer.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingId ? 'Modifier' : 'Nouvelle'} remise</h2>
              <button type="button" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-xl px-3 py-2" placeholder="Soldes d'ete" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as Discount['type'] })}
                  className="w-full border rounded-xl px-3 py-2 bg-white">
                  <option value="percentage">% Pourcentage</option>
                  <option value="fixed">DA Fixe</option>
                  <option value="free_shipping">Livraison offerte</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valeur</label>
                <input type="number" min={0} value={formData.value} onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min commande</label>
                <input type="number" min={0} value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Limite (0 = ∞)</label>
                <input type="number" min={0} value={formData.usageLimit} onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2" />
              </div>
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
