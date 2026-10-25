// src/AuthContext.jsx
import React, { createContext, useEffect, useState, useContext } from 'react';
import { auth, googleProvider, signInWithPopup, signOut, isFirebaseConfigured } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local demo mode for development preview
      const cached = localStorage.getItem('delulu_user');
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          localStorage.removeItem('delulu_user');
        }
      }
      setLoading(false);
    }
  }, []);

  const signIn = async () => {
    if (isFirebaseConfigured && auth) {
      await signInWithPopup(auth, googleProvider);
    } else {
      // Fallback demo user
      const demoUser = {
        uid: 'user_alex',
        displayName: 'Alex (You)',
        email: 'alex@delulu.chat',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      };
      localStorage.setItem('delulu_user', JSON.stringify(demoUser));
      setUser(demoUser);
    }
  };

  const signOutUser = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem('delulu_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut: signOutUser, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

