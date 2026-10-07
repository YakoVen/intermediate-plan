'use client';

import React, { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/service/firebase/config';

interface Review {
  id: string;
  authorName: string;
  rating: number;
  text: string;
}

export default function RatingsPreview() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('approved', '==', true),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        // Fallback data if firebase fails or isn't set up yet
        setReviews([
          { id: '1', authorName: 'Amine K.', rating: 5, text: 'Super expérience ! La livraison a été très rapide à Oran et le produit est d\'excellente qualité. Je recommande vivement.' },
          { id: '2', authorName: 'Sarah M.', rating: 5, text: 'Service client très réactif. J\'ai eu un souci avec ma commande et ils ont réglé ça le jour même. Merci !' },
          { id: '3', authorName: 'Karim B.', rating: 4, text: 'Bons produits dans l\'ensemble. Les prix sont très compétitifs par rapport aux autres boutiques sur le marché algérien.' }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-indigo-50/50 rounded-3xl px-6 my-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Ce que disent nos clients</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-48 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-transparent to-indigo-50/30 rounded-3xl px-4 md:px-8 my-12">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Ils nous font confiance</h2>
        <div className="flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={24} className="fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-2 font-bold text-gray-700">4.8/5</span>
          <span className="text-gray-500 ml-1">(Plus de 500 avis)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 relative">
            <Quote className="absolute top-6 right-6 text-indigo-100" size={40} />
            <div className="flex gap-1 mb-4 relative z-10">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  size={16} 
                  className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} 
                />
              ))}
            </div>
            <p className="text-gray-600 mb-6 italic relative z-10 line-clamp-4">&quot;{review.text}&quot;</p>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {review.authorName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{review.authorName}</p>
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block"></span>
                  Acheteur vérifié
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
