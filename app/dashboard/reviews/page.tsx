'use client';

import { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Review } from '@/interfaces/review';
import { getReviews, updateReviewStatus, deleteReview, getArticle } from '@/service/firebase/database';
import toast from 'react-hot-toast';

type Tab = 'pending' | 'approved' | 'rejected';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await getReviews();
      setReviews(data);
      const ids = [...new Set(data.map((r) => r.articleId))];
      const entries = await Promise.all(ids.map(async (id) => {
        try {
          const a = await getArticle(id);
          return [id, a?.title ?? id] as const;
        } catch {
          return [id, id] as const;
        }
      }));
      setTitles(Object.fromEntries(entries));
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(id: string, status: Tab) {
    try {
      await updateReviewStatus(id, status);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(status === 'approved' ? 'Avis approuve' : 'Avis rejete');
    } catch {
      toast.error('Erreur de mise a jour');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet avis ?')) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success('Avis supprime');
    } catch {
      toast.error('Erreur de suppression');
    }
  }

  const filteredReviews = reviews.filter((r) => r.status === activeTab);
  const count = (s: Tab) => reviews.filter((r) => r.status === s).length;

  function renderStars(rating: number) {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} size={14} className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
    ));
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pending', label: `En attente (${count('pending')})` },
    { id: 'approved', label: 'Approuvés' },
    { id: 'rejected', label: 'Rejetés' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Avis clients</h1>

      <div className="flex border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{review.authorName}</span>
                    <span className="text-gray-400 text-sm">• {review.date ? review.date.slice(0, 10) : ''}</span>
                  </div>
                  <div className="text-sm text-indigo-600 font-medium mb-2">Produit : {titles[review.articleId] || review.articleId}</div>
                  <div className="flex gap-1 mb-3">{renderStars(review.rating)}</div>
                  <p className="text-gray-700 text-sm">{review.text}</p>
                </div>

                <div className="flex gap-2">
                  {review.status !== 'approved' && (
                    <button onClick={() => handleStatus(review.id, 'approved')} title="Approuver"
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle size={18} /></button>
                  )}
                  {review.status !== 'rejected' && (
                    <button onClick={() => handleStatus(review.id, 'rejected')} title="Rejeter"
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"><XCircle size={18} /></button>
                  )}
                  <button onClick={() => handleDelete(review.id)} title="Supprimer"
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500">Aucun avis dans cet onglet.</div>
        )}
      </div>
    </div>
  );
}
