import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Moon, Sun, LogOut, Smartphone, Download, Trash2, Crown, Mail, AlertTriangle } from 'lucide-react';
import { getEntries } from '../services/storageService';
import { deleteAccount } from '../services/accountService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  onContact?: () => void;
}

const ProBadge = ({ size = "sm", className = "" }: { size?: "sm" | "md" | "lg", className?: string }) => {
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5"
  };
  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  return (
    <span className={`inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-full ${sizeClasses[size]} ${className}`}>
      <Crown size={iconSizes[size]} />
      <span>PRO</span>
    </span>
  );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onUpgrade, onContact }) => {
  const { user, isGuest, logout, darkMode, toggleDarkMode } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen) return null;



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



  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteAccount();
      // User will be automatically logged out after account deletion
      onClose();
    } catch (error: any) {
      console.error("Delete account failed:", error);
      setDeleteError(error.message || "Failed to delete account. Please try again.");
      setDeleting(false);
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
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-zinc-600 flex items-center justify-center text-gray-700 dark:text-white font-bold text-xl">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  (user?.email?.[0] || "G").toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-apple-text dark:text-white truncate">
                  {user?.displayName || user?.email || "Guest User"}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Smartphone className="w-3 h-3" />
                  <span>Local Storage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Membership</label>
            <div className="p-5 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-bold text-gray-900 dark:text-white">Inner Circle</h4>
                  <span className="text-[10px] px-2 py-0.5 bg-purple-600/10 text-purple-700 dark:text-purple-300 rounded-full font-semibold">Limited Access</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 mb-4 leading-relaxed">
                  Join a select community unlocking unlimited voice journaling, deep AI insights, and exclusive early access to transformative features.
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">$9.99</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                </div>
                <a
                  href={`mailto:${import.meta.env.VITE_UPGRADE_EMAIL || 'upgrade@yourjournal.app'}?subject=Inner Circle Membership Request&body=Hi, I'd like to upgrade to Inner Circle membership. My account email: ${user?.email || 'N/A'}`}
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-500 hover:via-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 no-underline"
                >
                  <Crown className="w-4 h-4" />
                  Claim Your Spot
                </a>
              </div>
            </div>
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

            <button
              onClick={() => {
                onContact?.();
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-900 dark:text-white" />
                <div className="text-left">
                  <div className="font-medium text-apple-text dark:text-white">Contact Support</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Explorer Pass or send feedback</div>
                </div>
              </div>
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
              <div className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-black dark:bg-white' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'left-6' : 'left-1'}`} />
              </div>
            </button>
          </div>

          {/* Danger Zone */}
          {!isGuest && (
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-zinc-700">
              <label className="text-xs font-bold text-red-500 uppercase tracking-wider">Danger Zone</label>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div className="text-left">
                    <div className="font-medium text-red-700 dark:text-red-300">Delete Account</div>
                    <div className="text-xs text-red-600 dark:text-red-400">Permanently delete all your data</div>
                  </div>
                </div>
              </button>
            </div>
          )}

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-xl text-red-700 dark:text-red-300">Delete Account?</h3>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This action <strong>cannot be undone</strong>. This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li>All your journal entries</li>
                <li>Your account data</li>
                <li>All settings and preferences</li>
              </ul>

              {deleteError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-600 dark:text-red-400">
                    <p className="font-bold mb-1">Error</p>
                    <p>{deleteError}</p>
                    {deleteError.includes("log out") && (
                      <button
                        onClick={() => {
                          logout();
                          onClose();
                        }}
                        className="mt-2 px-3 py-1.5 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                      >
                        Log Out Now
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                  Type <span className="font-mono bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded">DELETE</span> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={deleting}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput("");
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;