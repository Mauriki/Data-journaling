import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { migrateLocalToCloud } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  darkMode: boolean;
  loginGoogle: () => Promise<void>;
  loginGuest: () => void;
  logout: () => Promise<void>;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Handle Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
        
        // Run migration: If user had local data, move it to cloud
        await migrateLocalToCloud(currentUser.uid);
      } else {
        setUser(null);
        // We don't automatically set isGuest to true here to allow the Login screen to show
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Handle Dark Mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('dj_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newVal = !prev;
      if (newVal) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('dj_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('dj_theme', 'light');
      }
      return newVal;
    });
  };

  const loginGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      setLoading(false);
      throw error;
    }
  };

  const loginGuest = () => {
    setIsGuest(true);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, darkMode, loginGoogle, loginGuest, logout, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};