import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let _app: FirebaseApp | null = null;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

// NOTE: these used to be Proxy objects for lazy init, but the Firestore/Auth
// SDKs validate arguments with instanceof checks that a Proxy fails, so every
// doc()/collection() call threw "Expected first argument to be ...". Eager
// init is side-effect free (no network until first read/write).
const _appInstance = getApp();
export const db: Firestore = getFirestore(_appInstance);
export const auth: Auth = getAuth(_appInstance);
export const storage: FirebaseStorage = getStorage(_appInstance);

export default getApp;
