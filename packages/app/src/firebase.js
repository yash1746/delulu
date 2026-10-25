// src/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || (typeof process !== 'undefined' && process.env?.REACT_APP_FIREBASE_API_KEY),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (typeof process !== 'undefined' && process.env?.REACT_APP_FIREBASE_AUTH_DOMAIN),
  projectId: env.VITE_FIREBASE_PROJECT_ID || (typeof process !== 'undefined' && process.env?.REACT_APP_FIREBASE_PROJECT_ID),
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (typeof process !== 'undefined' && process.env?.REACT_APP_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (typeof process !== 'undefined' && process.env?.REACT_APP_FIREBASE_MESSAGING_SENDER_ID),
  appId: env.VITE_FIREBASE_APP_ID || (typeof process !== 'undefined' && process.env?.REACT_APP_FIREBASE_APP_ID),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'undefined' &&
  firebaseConfig.apiKey !== ''
);

let app = null;
let auth = null;
let googleProvider = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

export { app, auth, googleProvider, db, signInWithPopup, signOut };

