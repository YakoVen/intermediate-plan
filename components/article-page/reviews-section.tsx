'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Review } from '@/interfaces/review';
import { getReviews, createReview } from '@/service/firebase/database';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

function Stars({ value, onPick }: { value: number; onPick?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onPick} onClick={() => onPick?.(n)} title={`${n} étoile${n > 1 ? 's' : ''}`}>
          <Star size={20} className={n <= value ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ articleId }: { articleId: string }) {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getReviews(articleId)
      .then((all) => setReviews(all.filter((r) => r.status === 'approved')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleId]);

  const average = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !text.trim()) {
      toast.error('Nom et avis requis');
      return;
    }
    setSending(true);
    try {
      await createReview({
        articleId,
        authorName: authorName.trim(),
        rating,
        text: text.trim(),
        status: 'pending',
        date: new Date().toISOString(),
        userId: currentUser?.uid,
      });
      setAuthorName('');
      setText('');
      setRating(5);
      toast.success('Avis envoye ! Visible après modération.');
    } catch {
      toast.error("Erreur d'envoi");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">
        Avis clients {average && <span className="text-lg font-medium text-gray-500">({average}/5 • {reviews.length})</span>}
      </h2>

      {loading ? (
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{r.authorName}</span>
                <span className="text-sm text-gray-500">{r.date ? r.date.slice(0, 10) : ''}</span>
              </div>
              <Stars value={r.rating} />
              <p className="text-gray-600">{r.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Aucun avis pour le moment. Soyez le premier !</p>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 max-w-2xl">
        <h3 className="font-bold text-gray-900">Laisser un avis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input value={authorName} onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Votre nom" className="border rounded-xl px-3 py-2" required />
          <div className="flex items-center"><Stars value={rating} onPick={setRating} /></div>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
          placeholder="Votre avis..." className="w-full border rounded-xl px-3 py-2" required />
        <button type="submit" disabled={sending}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
          {sending ? 'Envoi...' : 'Publier mon avis'}
        </button>
      </form>
    </div>
  );
}
