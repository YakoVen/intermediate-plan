import { db } from './config';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, addDoc, increment
} from 'firebase/firestore';
import { Article } from '../../interfaces/article';
import { Order } from '../../interfaces/order';
import { Coupon } from '../../interfaces/coupon';
import { Review } from '../../interfaces/review';
import { DeliveryZone } from '../../interfaces/delivery-zone';
import { UserProfile, UserAddress } from '../../interfaces/user';
import { Discount } from '../../interfaces/discount';
import { AbandonedCart } from '../../interfaces/abandoned-cart';

// --- Articles ---
export async function getArticles(filters?: { active?: boolean; category?: number }): Promise<Article[]> {
  let q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
  if (filters?.active !== undefined) {
    q = query(collection(db, 'articles'), where('active', '==', filters.active), orderBy('createdAt', 'desc'));
  }
  if (filters?.category !== undefined) {
    q = query(collection(db, 'articles'), where('category', '==', filters.category), orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
}

export async function getArticle(id: string): Promise<Article | null> {
  const docRef = doc(db, 'articles', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Article) : null;
}

export async function createArticle(article: Omit<Article, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'articles'), {
    ...article,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<void> {
  const docRef = doc(db, 'articles', id);
  await updateDoc(docRef, data);
}

export async function deleteArticle(id: string): Promise<void> {
  const docRef = doc(db, 'articles', id);
  await deleteDoc(docRef);
}

export async function saveArticle(article: Article): Promise<void> {
  const { id, ...data } = article;
  if (id) {
    await updateArticle(id, data);
  } else {
    await createArticle(data);
  }
}

export async function toggleArticleActive(id: string, active: boolean): Promise<void> {
  await updateArticle(id, { active });
}

// --- Orders ---
export async function getOrders(): Promise<Order[]> {
  const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const docRef = doc(db, 'orders', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Order) : null;
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'orders'), order);
  return docRef.id;
}

export async function updateOrderState(id: string, state: number): Promise<void> {
  const docRef = doc(db, 'orders', id);
  await updateDoc(docRef, { state });
}

export async function addTrackingNote(id: string, note: string): Promise<void> {
  const docRef = doc(db, 'orders', id);
  await updateDoc(docRef, { trackingNote: note });
}

export async function createFailedOrder(order: Omit<Order, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'orders'), { ...order, type: 'failed' });
  return docRef.id;
}

export async function getFailedOrders(): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('type', '==', 'failed'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

export async function resolveFailedOrder(id: string): Promise<void> {
  const docRef = doc(db, 'orders', id);
  await updateDoc(docRef, { type: 'order' });
}

// --- Reviews ---
export async function getReviews(articleId?: string): Promise<Review[]> {
  let q = query(collection(db, 'reviews'), orderBy('date', 'desc'));
  if (articleId) {
    q = query(collection(db, 'reviews'), where('articleId', '==', articleId), orderBy('date', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
}

export async function createReview(review: Omit<Review, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'reviews'), review);
  return docRef.id;
}

export async function updateReviewStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
  const docRef = doc(db, 'reviews', id);
  await updateDoc(docRef, { status });
}

export async function deleteReview(id: string): Promise<void> {
  const docRef = doc(db, 'reviews', id);
  await deleteDoc(docRef);
}

// --- Coupons ---
export async function getCoupons(): Promise<Coupon[]> {
  const q = query(collection(db, 'coupons'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
}

export async function createCoupon(coupon: Omit<Coupon, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'coupons'), coupon);
  return docRef.id;
}

export async function updateCoupon(id: string, data: Partial<Coupon>): Promise<void> {
  const docRef = doc(db, 'coupons', id);
  await updateDoc(docRef, data);
}

export async function deleteCoupon(id: string): Promise<void> {
  const docRef = doc(db, 'coupons', id);
  await deleteDoc(docRef);
}

export async function validateCoupon(code: string): Promise<Coupon | null> {
  const q = query(collection(db, 'coupons'), where('code', '==', code), where('active', '==', true));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() } as Coupon;
}

export async function incrementCouponUsage(id: string): Promise<void> {
  const docRef = doc(db, 'coupons', id);
  await updateDoc(docRef, { usageCount: increment(1) });
}

// --- Delivery Zones ---
export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const snapshot = await getDocs(collection(db, 'delivery_zones'));
  return snapshot.docs.map(doc => doc.data() as DeliveryZone);
}

export async function updateDeliveryZone(wilayaId: number, data: Partial<DeliveryZone>): Promise<void> {
  const q = query(collection(db, 'delivery_zones'), where('wilayaId', '==', wilayaId));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docRef = doc(db, 'delivery_zones', snapshot.docs[0].id);
    await updateDoc(docRef, data);
  } else {
    await addDoc(collection(db, 'delivery_zones'), { wilayaId, ...data });
  }
}

export async function getDeliveryPrice(wilayaId: number, method: 'home' | 'desk'): Promise<number> {
  const q = query(collection(db, 'delivery_zones'), where('wilayaId', '==', wilayaId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return 500; // default
  const data = snapshot.docs[0].data() as DeliveryZone;
  return method === 'home' ? data.homePrice : data.deskPrice;
}

// --- Users ---
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as UserProfile) : null;
}

export async function createUserProfile(userId: string, data: Omit<UserProfile, 'id'>): Promise<void> {
  await setDoc(doc(db, 'users', userId), data);
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', userId), data);
}

export async function addUserAddress(userId: string, address: Omit<UserAddress, 'id'>): Promise<void> {
  const profile = await getUserProfile(userId);
  if (profile) {
    const addresses = profile.addresses || [];
    const newAddress = { ...address, id: Date.now().toString() };
    await updateDoc(doc(db, 'users', userId), { addresses: [...addresses, newAddress] });
  }
}

export async function updateUserAddress(userId: string, addressId: string, data: Partial<UserAddress>): Promise<void> {
  const profile = await getUserProfile(userId);
  if (profile && profile.addresses) {
    const addresses = profile.addresses.map(a => a.id === addressId ? { ...a, ...data } : a);
    await updateDoc(doc(db, 'users', userId), { addresses });
  }
}

export async function deleteUserAddress(userId: string, addressId: string): Promise<void> {
  const profile = await getUserProfile(userId);
  if (profile && profile.addresses) {
    const addresses = profile.addresses.filter(a => a.id !== addressId);
    await updateDoc(doc(db, 'users', userId), { addresses });
  }
}

export async function addToWishlist(userId: string, articleId: string): Promise<void> {
  const profile = await getUserProfile(userId);
  if (profile) {
    const wishlist = profile.wishlist || [];
    if (!wishlist.includes(articleId)) {
      await updateDoc(doc(db, 'users', userId), { wishlist: [...wishlist, articleId] });
    }
  }
}

export async function removeFromWishlist(userId: string, articleId: string): Promise<void> {
  const profile = await getUserProfile(userId);
  if (profile && profile.wishlist) {
    const wishlist = profile.wishlist.filter(id => id !== articleId);
    await updateDoc(doc(db, 'users', userId), { wishlist });
  }
}

export async function getWishlist(userId: string): Promise<string[]> {
  const profile = await getUserProfile(userId);
  return profile?.wishlist || [];
}

// --- Discounts ---
export async function getDiscounts(): Promise<Discount[]> {
  const q = query(collection(db, 'discounts'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discount));
}

export async function createDiscount(discount: Omit<Discount, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'discounts'), discount);
  return docRef.id;
}

export async function updateDiscount(id: string, data: Partial<Discount>): Promise<void> {
  const docRef = doc(db, 'discounts', id);
  await updateDoc(docRef, data);
}

export async function deleteDiscount(id: string): Promise<void> {
  const docRef = doc(db, 'discounts', id);
  await deleteDoc(docRef);
}

export async function getActiveDiscounts(): Promise<Discount[]> {
  const q = query(collection(db, 'discounts'), where('active', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discount));
}

export async function applyBestDiscount(cartTotal: number, discounts: Discount[]): Promise<Discount | null> {
  const validDiscounts = discounts.filter(d => d.active && (!d.minOrderAmount || cartTotal >= d.minOrderAmount));
  if (validDiscounts.length === 0) return null;
  // Simplistic selection of the first valid discount; can be expanded
  return validDiscounts[0];
}

export async function incrementDiscountUsage(id: string): Promise<void> {
  const docRef = doc(db, 'discounts', id);
  await updateDoc(docRef, { usageCount: increment(1) });
}

// --- Abandoned Carts ---
export async function saveAbandonedCart(cart: Omit<AbandonedCart, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'abandoned_carts'), cart);
  return docRef.id;
}

export async function updateAbandonedCartStatus(id: string, status: 'active' | 'recovered' | 'resolved'): Promise<void> {
  const docRef = doc(db, 'abandoned_carts', id);
  await updateDoc(docRef, { status });
}

export async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  const q = query(collection(db, 'abandoned_carts'), orderBy('abandonedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AbandonedCart));
}

export async function markCartRecovered(id: string): Promise<void> {
  await updateAbandonedCartStatus(id, 'recovered');
}
