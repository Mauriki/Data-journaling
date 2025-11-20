import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Feather, ArrowRight } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { loginGoogle, loginGuest, loading } = useAuth();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-apple-bg dark:bg-zinc-900 text-apple-text dark:text-white p-4 transition-colors duration-500">
      
      <div className="w-full max-w-md animate-fade-in">
        
        {/* Logo Area */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white dark:bg-zinc-800 shadow-float mb-6">
            <Feather className="w-10 h-10 text-apple-text dark:text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Data Journaling</h1>
          <p className="text-apple-gray dark:text-zinc-400 text-lg">
            Your life, beautifully documented.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/70 dark:bg-zinc-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-apple border border-white/20 dark:border-white/5">
          
          <div className="space-y-4">
            <button
              onClick={loginGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-apple-text dark:bg-white text-white dark:text-black font-semibold py-4 rounded-xl transition-transform active:scale-[0.98] hover:shadow-lg disabled:opacity-70"
            >
              {loading ? (
                <span>Connecting...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-transparent px-2 text-xs text-gray-400 uppercase tracking-wider">Or</span>
              </div>
            </div>

            <button
              onClick={loginGuest}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-zinc-700 text-apple-text dark:text-white font-medium py-4 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
            <Lock className="w-3 h-3" />
            <span>
              Guest data is encrypted locally using AES-GCM. <br/>
              Cloud data is secured by Google Firestore.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;