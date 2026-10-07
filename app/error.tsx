'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import LayoutWrapper from '@/components/general/layout-wrapper';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
          <AlertTriangle size={48} />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Oups ! Une erreur est survenue.
        </h2>
        
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Nous sommes désolés, mais un problème inattendu s&apos;est produit. Notre équipe technique a été notifiée.
        </p>
        
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md hover:shadow-indigo-200"
        >
          <RefreshCcw size={20} className="mr-2" />
          Réessayer
        </button>
      </div>
    </LayoutWrapper>
  );
}
