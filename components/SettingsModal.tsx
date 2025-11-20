import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Moon, Sun, LogOut, Cloud, Smartphone } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, isGuest, logout, darkMode, toggleDarkMode } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-zinc-700 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-700">
          <h3 className="font-bold text-lg text-apple-text dark:text-white">Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Account Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account</label>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200 font-bold text-xl">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full" />
                ) : (
                  user?.email?.[0].toUpperCase() || "G"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-apple-text dark:text-white truncate">
                  {user?.displayName || "Guest User"}
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