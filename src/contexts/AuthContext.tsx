import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { migrateLocalToCloud } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  darkMode: boolean;
  isPro: boolean;
  usage: { transcriptionSeconds: number; aiSummaryCount: number };
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string) => Promise<void>;
  loginGuest: () => void;
  logout: () => Promise<void>;
  toggleDarkMode: () => void;
  incrementUsage: (seconds: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isPro] = useState(false);
  const [usage, setUsage] = useState({ transcriptionSeconds: 0, aiSummaryCount: 0 });

  // Handle redirect result (for signInWithRedirect)
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log('Redirect sign-in successful');
      }
    }).catch((error) => {
      console.error('Redirect sign-in error:', error.code, error.message);
    });
  }, []);

  // Handle Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false); // Ensure guest mode is off if user is found

        // Run migration: If user had local data (from guest mode), move it to cloud
        await migrateLocalToCloud(currentUser.uid);

        // Load usage
        import('../services/accountService').then(async (service) => {
          const userUsage = await service.getUserUsage(currentUser.uid);
          setUsage(userUsage);
        });

      } else {
        setUser(null);
        setUsage({ transcriptionSeconds: 0, aiSummaryCount: 0 });
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
      console.log('Attempting Google sign-in with popup...');
      await signInWithPopup(auth, googleProvider);
      console.log('Sign-in successful');
    } catch (error: any) {
      console.error('Google sign-in error:', error.code, error.message);

      // If popup was blocked or failed, try redirect method
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        console.log('Popup failed, trying redirect...');
        await signInWithRedirect(auth, googleProvider);
        return; // Page will redirect, don't throw
      }

      setLoading(false);
      throw error;
    }
  };

  const loginEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const registerEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const loginGuest = () => {
    setIsGuest(true);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const incrementUsage = async (seconds: number) => {
    if (user) {
      setUsage(prev => ({ ...prev, transcriptionSeconds: prev.transcriptionSeconds + seconds }));
      import('../services/accountService').then(service => {
        service.updateUserUsage(user.uid, seconds);
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, darkMode, isPro, usage, loginGoogle, loginEmail, registerEmail, loginGuest, logout, toggleDarkMode, incrementUsage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};