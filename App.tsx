import React, { useState, useEffect } from 'react';
import JournalEditor from './components/JournalEditor';
import HistoryDashboard from './components/HistoryDashboard';
import LoginPage from './components/LoginPage';
import SettingsModal from './components/SettingsModal';
import ErrorBoundary from './components/ErrorBoundary';
import { Book, BarChart2, Flame, UserCircle } from 'lucide-react';
import { getStreak, runMigration } from './services/storageService';
import { AuthProvider, useAuth } from './contexts/AuthContext';

type View = 'journal' | 'history';

const AppContent: React.FC = () => {
  const { user, isGuest, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('journal');
  const [editDate, setEditDate] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Run initialization logic when user/guest status is confirmed
  useEffect(() => {
    const init = async () => {
      if (user || isGuest) {
        // Run legacy migration just in case
        await runMigration();
        const s = await getStreak();
        setStreak(s);
        setIsReady(true);
      }
    };
    init();
  }, [user, isGuest]);

  // Update streak on view change
  useEffect(() => {
    if (isReady) updateStreak();
  }, [currentView, isReady]);

  const updateStreak = async () => {
    const s = await getStreak();
    setStreak(s);
  };

  const handleEditEntry = (date: string) => {
    setEditDate(date);
    setCurrentView('journal');
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-apple-bg dark:bg-zinc-900 text-apple-gray">Loading...</div>;
  }

  if (!user && !isGuest) {
    return <LoginPage />;
  }

  if (!isReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-apple-bg dark:bg-zinc-900">
        <div className="text-apple-gray text-sm font-medium animate-pulse">Synchronizing Journal...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-apple-bg dark:bg-zinc-900 transition-colors duration-500 relative">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Top Navigation Bar (Glassmorphism) */}
      <header className="flex-shrink-0 h-16 border-b border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-black/70 backdrop-blur-xl z-50 flex items-center justify-between px-4 md:px-8 transition-all sticky top-0">

        {/* Left: Navigation Tabs */}
        <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-zinc-800/80 p-1 rounded-lg">
          <button
            onClick={() => { setCurrentView('journal'); setEditDate(null); }}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-out
              ${currentView === 'journal'
                ? 'bg-white dark:bg-zinc-600 text-apple-text dark:text-white shadow-sm'
                : 'text-apple-gray dark:text-zinc-400 hover:text-apple-text hover:bg-white/50'}
            `}
          >
            <Book className="w-4 h-4" />
            <span className="hidden sm:inline">Journal</span>
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-out
              ${currentView === 'history'
                ? 'bg-white dark:bg-zinc-600 text-apple-text dark:text-white shadow-sm'
                : 'text-apple-gray dark:text-zinc-400 hover:text-apple-text hover:bg-white/50'}
            `}
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Index</span>
          </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 transition-all cursor-default">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'fill-orange-500' : ''}`} />
            <span className="text-xs font-semibold tracking-wide">{streak}</span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} className="w-8 h-8 rounded-full" alt="User" />
            ) : (
              <UserCircle className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative scroll-smooth">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 min-h-full">
          {currentView === 'journal' ? (
            <JournalEditor
              initialDate={editDate || new Date().toISOString().split('T')[0]}
              onSave={updateStreak}
            />
          ) : (
            <HistoryDashboard onEditEntry={handleEditEntry} />
          )}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;