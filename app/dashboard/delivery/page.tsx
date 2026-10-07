'use client';

import { useState } from 'react';
import AvailableButton from '@/components/dashboard/widget/available-button';
import { Save, Search } from 'lucide-react';

// Example for 3 wilayas, usually 58
const initialZones = [
  { id: '16', name: 'Alger', homePrice: 500, deskPrice: 300, active: true },
  { id: '09', name: 'Blida', homePrice: 600, deskPrice: 400, active: true },
  { id: '31', name: 'Oran', homePrice: 800, deskPrice: 500, active: false }
];

export default function DeliveryPage() {
  const [zones, setZones] = useState(initialZones);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredZones = zones.filter(z => z.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handlePriceChange = (id: string, field: 'homePrice' | 'deskPrice', value: string) => {
    setZones(zones.map(z => z.id === id ? { ...z, [field]: parseInt(value) || 0 } : z));
  };

  const toggleActive = (id: string) => {
    setZones(zones.map(z => z.id === id ? { ...z, active: !z.active } : z));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Tarifs de livraison enregistrés');
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tarifs de livraison</h1>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
          Enregistrer les modifications
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Rechercher une wilaya..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="p-4 font-medium w-24">Code</th>
                <th className="p-4 font-medium">Wilaya</th>
                <th className="p-4 font-medium">Prix à domicile (DZD)</th>
                <th className="p-4 font-medium">Prix point relais (DZD)</th>
                <th className="p-4 font-medium text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredZones.map((zone) => (
                <tr key={zone.id} className={`text-sm hover:bg-gray-50 ${!zone.active ? 'opacity-60' : ''}`}>
                  <td className="p-4 font-medium text-gray-500">{zone.id}</td>
                  <td className="p-4 font-bold text-gray-900">{zone.name}</td>
                  <td className="p-4">
                    <input 
                      type="number" 
                      value={zone.homePrice}
                      onChange={(e) => handlePriceChange(zone.id, 'homePrice', e.target.value)}
                      disabled={!zone.active}
                      className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="number" 
                      value={zone.deskPrice}
                      onChange={(e) => handlePriceChange(zone.id, 'deskPrice', e.target.value)}
                      disabled={!zone.active}
                      className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                    />
                  </td>
                  <td className="p-4 text-right">
                    <AvailableButton isActive={zone.active} onClick={() => toggleActive(zone.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
