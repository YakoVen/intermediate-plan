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
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0 };
  });

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
      <div>
        <h2 className="text-2xl font-bold text-ink">Avis clients</h2>
        <p className="text-sm text-slate2">Découvrez ce que nos clients pensent de ce produit.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary */}
        <div className="bg-white p-6 rounded-2xl border border-line shadow-sm">
          {loading ? (
            <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ) : reviews.length > 0 && average !== null ? (
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-ink">{average.toFixed(1)}/5</span>
              </div>
              <Stars value={Math.round(average)} />
              <p className="text-sm text-slate2">{reviews.length} avis</p>
              <div className="space-y-2">
                {distribution.map((d) => (
                  <div key={d.star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 font-medium text-ink">{d.star}</span>
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-sky rounded-full overflow-hidden">
                      <div className="h-full bg-blueprint rounded-full" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-slate2">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate2">Aucun avis pour le moment. Soyez le premier !</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
          <h3 className="font-bold text-ink">Laisser un avis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Votre nom" className="border border-line rounded-xl px-3 py-2 focus:ring-2 focus:ring-blueprint focus:border-transparent outline-none" required />
            <Stars value={rating} onPick={setRating} />
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
            placeholder="Votre avis..." className="w-full border border-line rounded-xl px-3 py-2 focus:ring-2 focus:ring-blueprint focus:border-transparent outline-none" required />
          <button type="submit" disabled={sending}
            className="bg-blueprint text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blueprint-dark disabled:opacity-50">
            {sending ? 'Envoi...' : 'Publier mon avis'}
          </button>
        </form>
      </div>

      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white p-6 rounded-2xl border border-line shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{r.authorName}</span>
                <span className="text-sm text-slate2">{r.date ? r.date.slice(0, 10) : ''}</span>
              </div>
              <Stars value={r.rating} />
              <p className="text-slate2">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
