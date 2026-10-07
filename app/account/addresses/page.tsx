'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react';

export default function AddressesPage() {
  const [addresses] = useState([
    {
      id: 1,
      label: 'Domicile',
      fullName: 'Mohamed Ali',
      phone: '+213 555 12 34 56',
      address: 'Cité 100 logts, Batiment A',
      wilaya: 'Alger',
      commune: 'Bab Ezzouar',
      isDefault: true
    },
    {
      id: 2,
      label: 'Travail',
      fullName: 'Mohamed Ali',
      phone: '+213 555 12 34 56',
      address: 'Technoparc de Sidi Abdellah',
      wilaya: 'Alger',
      commune: 'Zeralda',
      isDefault: false
    }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Mes Adresses</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une adresse
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <div key={address.id} className={`bg-white rounded-xl shadow-sm border p-6 relative ${address.isDefault ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'}`}>
            {address.isDefault && (
              <span className="absolute top-0 right-0 -mt-3 mr-4 px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full border border-indigo-200">
                Par défaut
              </span>
            )}
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className={`h-5 w-5 ${address.isDefault ? 'text-indigo-600' : 'text-gray-400'}`} />
              <h3 className="text-lg font-bold text-gray-900">{address.label}</h3>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p className="font-medium text-gray-900">{address.fullName}</p>
              <p>{address.phone}</p>
              <p>{address.address}</p>
              <p>{address.commune}, {address.wilaya}</p>
            </div>
            
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                <Edit2 className="mr-1 h-4 w-4" /> Modifier
              </button>
              <span className="text-gray-300">|</span>
              <button className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center">
                <Trash2 className="mr-1 h-4 w-4" /> Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Address Modal (Simplified) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-bold text-gray-900">Nouvelle adresse</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Libellé (ex: Maison)</label>
                      <input type="text" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2 outline-none" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                      <input type="text" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2 outline-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input type="tel" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2 outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adresse complète</label>
                    <textarea rows={3} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2 outline-none"></textarea>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Wilaya</label>
                      <select className="mt-1 block w-full bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 outline-none">
                        <option>16 - Alger</option>
                        <option>09 - Blida</option>
                        <option>31 - Oran</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Commune</label>
                      <input type="text" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2 outline-none" />
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-4">
                    <input id="default-address" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    <label htmlFor="default-address" className="ml-2 block text-sm text-gray-900">
                      Définir comme adresse par défaut
                    </label>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                  Enregistrer
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
