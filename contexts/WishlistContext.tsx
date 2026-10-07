"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/service/firebase/config';

interface WishlistContextProps {
  wishlist: string[];
  addToWishlist: (articleId: string) => void;
  removeFromWishlist: (articleId: string) => void;
  isInWishlist: (articleId: string) => boolean;
  toggleWishlist: (articleId: string) => void;
}

const WishlistContext = createContext<WishlistContextProps | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadWishlist = async () => {
      let localWishlist: string[] = [];
      const saved = localStorage.getItem('ecom_wishlist');
      if (saved) {
        try {
          localWishlist = JSON.parse(saved);
          setWishlist(localWishlist);
        } catch {}
      }

      if (currentUser && !loading) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            let firestoreWishlist: string[] = data.wishlist || [];
            
            // Merge local with firestore
            if (localWishlist.length > 0) {
              const merged = Array.from(new Set([...firestoreWishlist, ...localWishlist]));
              await updateDoc(userDocRef, { wishlist: merged });
              firestoreWishlist = merged;
              localStorage.removeItem('ecom_wishlist'); // Clear local after merge
            }
            
            setWishlist(firestoreWishlist);
          }
        } catch (error) {
          console.error("Error loading wishlist from Firestore:", error);
        }
      }
      setIsLoaded(true);
    };

    if (!loading) {
      loadWishlist();
    }
  }, [currentUser, loading]);

  useEffect(() => {
    if (isLoaded && !currentUser) {
      localStorage.setItem('ecom_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isLoaded, currentUser]);

  const addToWishlist = async (articleId: string) => {
    setWishlist(prev => Array.from(new Set([...prev, articleId])));
    
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          wishlist: arrayUnion(articleId)
        });
      } catch (error) {
        console.error("Error adding to Firestore wishlist:", error);
      }
    }
  };

  const removeFromWishlist = async (articleId: string) => {
    setWishlist(prev => prev.filter(id => id !== articleId));
    
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          wishlist: arrayRemove(articleId)
        });
      } catch (error) {
        console.error("Error removing from Firestore wishlist:", error);
      }
    }
  };

  const isInWishlist = (articleId: string) => {
    return wishlist.includes(articleId);
  };

  const toggleWishlist = (articleId: string) => {
    if (isInWishlist(articleId)) {
      removeFromWishlist(articleId);
    } else {
      addToWishlist(articleId);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
