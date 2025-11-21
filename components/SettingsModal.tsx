import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Moon, Sun, LogOut, Cloud, Smartphone, AlertTriangle, CheckCircle2, Copy, Download } from 'lucide-react';
import { getEntries } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, isGuest, loginGoogle, logout, darkMode, toggleDarkMode } = useAuth();
  const [syncError, setSyncError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleSync = async () => {
    try {
      setSyncError(null);
      setUnauthorizedDomain(null);
      await loginGoogle();
      onClose();
    } catch (err: any) {
      const isUnauthorized = 
        err?.code === 'auth/unauthorized-domain' || 
        err?.message?.includes('unauthorized-domain') ||
        String(err).includes('auth/unauthorized-domain');

      if (isUnauthorized) {
        setUnauthorizedDomain(window.location.hostname);
      } else {
        console.error("Sync failed", err);
        setSyncError("Sync failed. Try again or use Email login on the main screen.");
      }
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const entries = await getEntries();
      const dataStr = JSON.stringify(entries, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `journal_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = () => {
    if (unauthorizedDomain) {
      navigator.clipboard.writeText(unauthorizedDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-zinc-700 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-700">
          <h3 className="font-bold text-lg text-apple-text dark:text-white">Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Account Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account</label>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200 font-bold text-xl">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full" />
                ) : (
                  (user?.email?.[0] || "G").toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-apple-text dark:text-white truncate">
                  {user?.displayName || user?.email || "Guest User"}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {isGuest ? (
                    <>
                      <Smartphone className="w-3 h-3" />
                      <span>Local Storage</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3 h-3" />
                      <span>{user?.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isGuest && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                
                {unauthorizedDomain ? (
                  <div className="bg-white dark:bg-black/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800/50 mb-3">
                     <div className="flex items-start gap-2 text-orange-700 dark:text-orange-300 mb-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="text-xs font-bold">Authorization Required</span>
                     </div>
                     <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">
                       To enable sync, add this domain to Firebase Console &gt; Auth &gt; Settings &gt; Authorized Domains.
                     </p>
                     <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded border border-orange-100 dark:border-orange-900/50 font-mono text-[10px] mb-2 break-all">
                        {unauthorizedDomain}
                     </div>
                     <button 
                       onClick={copyToClipboard}
                       className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border border-orange-200 dark:border-orange-800 p-2 rounded text-orange-700 dark:text-orange-300 font-semibold text-xs hover:bg-orange-50 transition-colors"
                     >
                       {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                       {copied ? "Copied!" : "Copy Domain"}
                     </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-200">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Sync to Cloud</h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Sign in with Google to securely back up your journal.
                      </p>
                    </div>
                  </div>
                )}
                
                {syncError && !unauthorizedDomain && (
                  <div className="mb-3 text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {syncError}
                  </div>
                )}

                {!unauthorizedDomain && (
                  <button 
                    onClick={handleSync}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Connect Google Account
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Data Management */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data</label>
             <button 
               onClick={handleExport}
               disabled={exporting}
               className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
             >
               <div className="flex items-center gap-3">
                 <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                 <div className="text-left">
                   <div className="font-medium text-apple-text dark:text-white">Export Data</div>
                   <div className="text-xs text-gray-500 dark:text-gray-400">Download a backup of your journal</div>
                 </div>
               </div>
               {exporting && <span className="text-xs text-gray-400">Processing...</span>}
             </button>
          </div>

          {/* Preferences */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Appearance</label>
             <button 
               onClick={toggleDarkMode}
               className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
             >
               <div className="flex items-center gap-3">
                 {darkMode ? <Moon className="w-5 h-5 text-purple-500" /> : <Sun className="w-5 h-5 text-orange-500" />}
                 <span className="font-medium text-apple-text dark:text-white">Dark Mode</span>
               </div>
               <div className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'left-6' : 'left-1'}`} />
               </div>
             </button>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button 
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;