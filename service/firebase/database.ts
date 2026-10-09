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
import { FlashSale } from '../../interfaces/flash-sale';
import { Bundle } from '../../interfaces/bundle';
import { LoyaltyConfig, DEFAULT_LOYALTY } from '../../interfaces/loyalty';
import { ReturnRequest, RestockRequest, InventoryLog, InventorySettings, DEFAULT_INVENTORY } from '../../interfaces/returns';

// --- Articles ---
/**
 * In-memory descending sort by an ISO date-ish field.
 * Firestore requires a provisioned composite index for where()+orderBy()
 * combos, which this project does not create (the deploy key lacks index
 * permissions). Equality-only queries need no composite index, so we filter
 * server-side and sort here. Catalog sizes are in the hundreds at most.
 */
export function sortByDateDesc<T>(rows: T[], field: Extract<keyof T, string>): T[] {
  const key = (r: T): string => String((r as Record<string, unknown>)[field] ?? '');
  return [...rows].sort((a, b) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0));
}

export async function getArticles(filters?: { active?: boolean; category?: number }): Promise<Article[]> {
  let q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
  if (filters?.active !== undefined) {
    q = query(collection(db, 'articles'), where('active', '==', filters.active));
  }
  if (filters?.category !== undefined) {
    q = query(collection(db, 'articles'), where('category', '==', filters.category));
  }
  const snapshot = await getDocs(q);
  const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
  // Single-field orderBy needs no composite index; filtered queries are sorted here.
  return filters?.active !== undefined || filters?.category !== undefined
    ? sortByDateDesc(rows, 'createdAt')
    : rows;
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
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return sortByDateDesc(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)), 'date');
}

export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'orders'), order);
  return docRef.id;
}

export async function updateOrderState(id: string, state: number): Promise<void> {
  const docRef = doc(db, 'orders', id);
  await updateDoc(docRef, { state });
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<void> {
  const docRef = doc(db, 'orders', id);
  await updateDoc(docRef, data);
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
  const q = query(collection(db, 'orders'), where('type', '==', 'failed'));
  const snapshot = await getDocs(q);
  return sortByDateDesc(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)), 'date');
}

export async function resolveFailedOrder(id: string): Promise<void> {
  const docRef = doc(db, 'orders', id);
  await updateDoc(docRef, { type: 'order' });
}

// --- Reviews ---
export async function getReviews(articleId?: string): Promise<Review[]> {
  let q = query(collection(db, 'reviews'), orderBy('date', 'desc'));
  if (articleId) {
    q = query(collection(db, 'reviews'), where('articleId', '==', articleId));
  }
  const snapshot = await getDocs(q);
  const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
  return articleId ? sortByDateDesc(rows, 'date') : rows;
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
export async function getUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
}

// --- Activity log ---
export interface ActivityEntry {
  id: string;
  actorEmail?: string;
  action: string;
  detail?: string;
  at: string;
}

export async function logActivity(action: string, detail?: string, actorEmail?: string): Promise<void> {
  try {
    await addDoc(collection(db, 'activity_log'), {
      action, detail: detail || null, actorEmail: actorEmail || null, at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('logActivity error', err);
  }
}

export async function getActivityLog(limitCount = 50): Promise<ActivityEntry[]> {
  const q = query(collection(db, 'activity_log'), orderBy('at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() } as ActivityEntry))
    .slice(0, limitCount);
}

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

export async function updateAbandonedCart(id: string, data: Partial<AbandonedCart>): Promise<void> {
  await updateDoc(doc(db, 'abandoned_carts', id), data);
}

/** Create or refresh the active snapshot for a session (prevents duplicates). */
export async function saveOrUpdateAbandonedCart(cart: Omit<AbandonedCart, 'id' | 'status' | 'createdAt' | 'abandonedAt'>): Promise<string> {
  const q = query(
    collection(db, 'abandoned_carts'),
    where('sessionId', '==', cart.sessionId),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);
  const now = new Date().toISOString();
  if (!snapshot.empty) {
    const d = snapshot.docs[0];
    await updateDoc(doc(db, 'abandoned_carts', d.id), { ...cart, abandonedAt: now });
    return d.id;
  }
  const docRef = await addDoc(collection(db, 'abandoned_carts'), {
    ...cart, status: 'active', createdAt: now, abandonedAt: now,
  });
  return docRef.id;
}

// --- Flash Sales ---
export async function getFlashSales(): Promise<FlashSale[]> {
  const q = query(collection(db, 'flash_sales'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlashSale));
}

export async function createFlashSale(data: Omit<FlashSale, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'flash_sales'), data);
  return docRef.id;
}

export async function updateFlashSale(id: string, data: Partial<FlashSale>): Promise<void> {
  await updateDoc(doc(db, 'flash_sales', id), data);
}

export async function deleteFlashSale(id: string): Promise<void> {
  await deleteDoc(doc(db, 'flash_sales', id));
}

/** Sales whose window covers right now (auto-revert is inherent: outside the window nothing applies). */
export function isSaleLive(sale: FlashSale, now: Date = new Date()): boolean {
  if (!sale.active) return false;
  const t = now.getTime();
  return new Date(sale.startsAt).getTime() <= t && t <= new Date(sale.endsAt).getTime();
}

export async function getLiveFlashSales(now: Date = new Date()): Promise<FlashSale[]> {
  const all = await getFlashSales();
  return all.filter((s) => isSaleLive(s, now));
}

// --- Bundles ---
export async function getBundles(activeOnly = false): Promise<Bundle[]> {
  const q = query(collection(db, 'bundles'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle));
  return activeOnly ? all.filter((b) => b.active) : all;
}

export async function createBundle(data: Omit<Bundle, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'bundles'), data);
  return docRef.id;
}

export async function updateBundle(id: string, data: Partial<Bundle>): Promise<void> {
  await updateDoc(doc(db, 'bundles', id), data);
}

export async function deleteBundle(id: string): Promise<void> {
  await deleteDoc(doc(db, 'bundles', id));
}

// --- Settings (key-value docs in `settings` collection) ---
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const snap = await getDoc(doc(db, 'settings', key));
    if (snap.exists()) return { ...fallback, ...(snap.data() as Partial<T>) };
  } catch (err) {
    console.error(`getSetting ${key} error`, err);
  }
  return fallback;
}

export async function setSetting<T extends object>(key: string, data: T): Promise<void> {
  await setDoc(doc(db, 'settings', key), data, { merge: true });
}

export async function getLoyaltyConfig(): Promise<LoyaltyConfig> {
  return getSetting<LoyaltyConfig>('loyalty', DEFAULT_LOYALTY);
}

export async function getInventorySettings(): Promise<InventorySettings> {
  return getSetting<InventorySettings>('inventory', DEFAULT_INVENTORY);
}

// --- Returns ---
export async function getReturns(status?: ReturnRequest['status']): Promise<ReturnRequest[]> {
  const q = query(collection(db, 'returns'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReturnRequest));
  return status ? all.filter((r) => r.status === status) : all;
}

export async function getReturnByOrder(orderId: string): Promise<ReturnRequest | null> {
  const q = query(collection(db, 'returns'), where('orderId', '==', orderId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as ReturnRequest;
}

export async function createReturnRequest(data: Omit<ReturnRequest, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'returns'), data);
  return docRef.id;
}

export async function updateReturnStatus(id: string, status: ReturnRequest['status'], adminNote?: string): Promise<void> {
  await updateDoc(doc(db, 'returns', id), {
    status,
    adminNote: adminNote ?? null,
    decidedAt: new Date().toISOString(),
  });
}

// --- Restock requests ---
export async function createRestockRequest(articleId: string, contact: string): Promise<string> {
  const docRef = await addDoc(collection(db, 'restock_requests'), {
    articleId,
    contact: contact.trim(),
    createdAt: new Date().toISOString(),
    notified: false,
  });
  return docRef.id;
}

export async function getRestockRequests(pendingOnly = false): Promise<RestockRequest[]> {
  const q = query(collection(db, 'restock_requests'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RestockRequest));
  return pendingOnly ? all.filter((r) => !r.notified) : all;
}

export async function markRestockNotified(id: string): Promise<void> {
  await updateDoc(doc(db, 'restock_requests', id), { notified: true });
}

// --- Inventory log + stock moves ---
export async function logInventory(articleId: string, change: number, reason: string, by?: string): Promise<void> {
  try {
    await addDoc(collection(db, 'inventory_log'), {
      articleId, change, reason, by: by || null, at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('logInventory error', err);
  }
}

export async function getInventoryLog(articleId?: string, limitCount = 50): Promise<InventoryLog[]> {
  const q = query(collection(db, 'inventory_log'), orderBy('at', 'desc'));
  const snapshot = await getDocs(q);
  const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryLog));
  const filtered = articleId ? all.filter((l) => l.articleId === articleId) : all;
  return filtered.slice(0, limitCount);
}

/** Decrement stock for ordered items (variants first, else totalStock). Never below 0. */
export async function decrementStockForOrder(items: { articleId: string; quantity: number; variantId?: string }[]): Promise<void> {
  for (const item of items) {
    try {
      const article = await getArticle(item.articleId);
      if (!article) continue;
      if (article.hasVariants && item.variantId && article.variants) {
        const variants = article.variants.map((v) =>
          v.id === item.variantId ? { ...v, stock: Math.max((v.stock ?? 0) - item.quantity, 0) } : v
        );
        const totalStock = variants.reduce((s, v) => s + (v.stock ?? 0), 0);
        await updateArticle(item.articleId, { variants, totalStock });
      } else if (article.totalStock !== undefined) {
        await updateArticle(item.articleId, { totalStock: Math.max(article.totalStock - item.quantity, 0) });
      }
      await logInventory(item.articleId, -item.quantity, 'order', 'checkout');
    } catch (err) {
      console.error('decrementStock error', err);
    }
  }
}
