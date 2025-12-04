import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Feather, ArrowRight, AlertTriangle, Copy, CheckCircle2, Mail } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { loginGoogle, loginGuest, loginEmail, registerEmail, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Email Auth State
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Detect domain on mount
  useEffect(() => {
    if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
      // Just store it for reference, don't error yet
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setUnauthorizedDomain(null);
      await loginGoogle();
    } catch (err: any) {
      const isUnauthorized =
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('unauthorized-domain') ||
        String(err).includes('auth/unauthorized-domain');

      const isBlockedReferer =
        err?.code?.includes('requests-from-referer') ||
        err?.message?.includes('requests-from-referer') ||
        String(err).includes('are-blocked');

      if (isUnauthorized || isBlockedReferer) {
        setUnauthorizedDomain(window.location.hostname);
        return;
      }

      if (err?.code === 'auth/popup-closed-by-user') {
        setError("Sign-in cancelled.");
        return;
      }

      console.error("Google Login Error:", err);
      setError(err?.message || "Unable to sign in with Google.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnauthorizedDomain(null);

    try {
      if (isSignUp) {
        await registerEmail(email, password);
      } else {
        await loginEmail(email, password);
      }
    } catch (err: any) {
      const isUnauthorized =
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('unauthorized-domain');

      if (isUnauthorized) {
        setUnauthorizedDomain(window.location.hostname);
        return;
      }

      setError(err?.message || "Authentication failed.");
    }
  };

  const copyToClipboard = () => {
    const domain = unauthorizedDomain || window.location.hostname;
    navigator.clipboard.writeText(domain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-apple-bg dark:bg-zinc-900 text-apple-text dark:text-white p-4 transition-colors duration-500">

      <div className="w-full max-w-md animate-fade-in">

        {/* Logo Area */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-accent-leather to-accent-wood shadow-warm mb-8 animate-zoom-in hover:animate-wiggle transition-all cursor-pointer">
            <Feather className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 animate-slide-in-from-bottom" style={{ animationDelay: '0.1s' }}>Data Journaling</h1>
          <p className="text-apple-gray dark:text-zinc-400 text-lg animate-slide-in-from-bottom" style={{ animationDelay: '0.2s' }}>
            Your life, beautifully documented.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/70 dark:bg-zinc-800/50 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-float border border-white/40 dark:border-white/5 overflow-hidden animate-slide-in-from-bottom" style={{ animationDelay: '0.3s' }}>

          {/* UNAUTHORIZED DOMAIN ERROR - THE FIX */}
          {unauthorizedDomain && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-2xl text-sm">
              <div className="flex items-start gap-3 text-orange-800 dark:text-orange-200 mb-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="font-bold">Action Required: Whitelist Domain</span>
              </div>
              <p className="text-orange-700 dark:text-orange-300 mb-3 leading-relaxed">
                Google blocked the login because this preview domain is not on your Firebase safe list.
              </p>
              <div className="bg-white/50 dark:bg-black/20 p-2 rounded mb-3 font-mono text-xs break-all border border-orange-200 dark:border-orange-800 text-center">
                {unauthorizedDomain}
              </div>
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-black/40 border border-orange-200 dark:border-orange-800 p-2.5 rounded-lg text-orange-800 dark:text-orange-200 font-semibold text-xs hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors shadow-sm"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Domain"}
              </button>
              <p className="mt-3 text-[11px] text-orange-600 dark:text-orange-400 text-center">
                Or use <strong>Guest Mode</strong> below to skip this.
              </p>
            </div>
          )}

          {error && !unauthorizedDomain && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {!showEmailAuth ? (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-accent-leather hover:bg-accent-wood text-white font-semibold py-4 rounded-2xl transition-all active:scale-[0.98] hover:shadow-warm hover:-translate-y-0.5 disabled:opacity-70"
              >
                {loading ? "Connecting..." : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowEmailAuth(true)}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-apple-text dark:text-white font-medium py-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span>Continue with Email</span>
              </button>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-zinc-700"></div></div>
                <div className="relative flex justify-center"><span className="bg-transparent px-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Or</span></div>
              </div>

              <button
                onClick={loginGuest}
                className="w-full flex items-center justify-center gap-2 bg-accent-sand dark:bg-zinc-700/50 text-accent-wood dark:text-white font-medium py-4 rounded-2xl hover:bg-accent-cream dark:hover:bg-zinc-600 transition-all hover:-translate-y-0.5 group"
              >
                <span>Continue as Guest</span>
                <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-5 animate-slide-in-from-right">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Email Address</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Password</label>
                <input
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
              >
                {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
              </button>

              <div className="flex items-center justify-between text-sm pt-2">
                <button type="button" onClick={() => setShowEmailAuth(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 font-medium">Back</button>
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 hover:underline font-medium">
                  {isSignUp ? "Already have an account?" : "Create an account"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-10 flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wide font-medium">
            <Lock className="w-3 h-3" />
            <span>
              Guest data encrypted locally.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;