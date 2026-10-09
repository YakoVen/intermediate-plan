'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Save, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/service/firebase/config';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, userProfile, loading: authLoading, updateProfileData } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) router.push('/login');
  }, [authLoading, currentUser, router]);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
    } else if (currentUser) {
      setFullName(currentUser.displayName || '');
    }
  }, [userProfile, currentUser]);

  const initials = (fullName || 'U').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Nom requis');
      return;
    }
    setLoading(true);
    try {
      await updateProfileData({ displayName: fullName.trim(), phone: phone.trim() || undefined });
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) {
      toast.error('6 caractères minimum');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error('Reconnectez-vous pour changer le mot de passe');
      return;
    }
    setPwLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      toast.success('Mot de passe mis à jour');
    } catch {
      toast.error('Mot de passe actuel incorrect');
    } finally {
      setPwLoading(false);
    }
  };

  if (authLoading) {
    return <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {initials}
              </div>
              <div className="absolute bottom-0 right-0 h-8 w-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{fullName || 'Mon compte'}</h2>
              <p className="text-sm text-gray-500">Mettez à jour vos informations personnelles</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Nom complet
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3 outline-none"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={userProfile?.email || currentUser?.email || ''}
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-500 sm:text-sm border py-2 px-3 outline-none cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">L&apos;email ne peut pas être modifié.</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center space-x-2 mb-6">
            <KeyRound className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Modifier le mot de passe</h2>
          </div>

          <form onSubmit={handlePassword} className="space-y-6 max-w-2xl">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                Mot de passe actuel
              </label>
              <input
                type="password"
                id="current-password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3 outline-none"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border py-2 px-3 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={pwLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                {pwLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
