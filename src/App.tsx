import React, { useState, useEffect, Suspense } from 'react';
import JournalEditor from './components/JournalEditor';
import LoginPage from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import { getStreak, runMigration } from './services/storageService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';

// Lazy Load Heavy Components
const HistoryDashboard = React.lazy(() => import('./components/HistoryDashboard'));
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
const ContactModal = React.lazy(() => import('./components/ContactModal'));

type View = 'journal' | 'history';


const AppContent: React.FC = () => {
  const { user, isGuest, loading, isPro, usage } = useAuth();
  const [currentView, setCurrentView] = useState<View>('journal');
  const [editDate, setEditDate] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile); // Default open on desktop

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="h-screen w-full flex bg-apple-bg dark:bg-zinc-900 transition-colors duration-500 overflow-hidden">
      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpgrade={() => { console.log("Upgrade clicked") }}
          onContact={() => setIsContactOpen(true)}
        />
        <ContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
        />
      </Suspense>

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentView={currentView}
        onViewChange={(view) => { setCurrentView(view); setEditDate(null); }}
        user={user}
        streak={streak}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMobile={isMobile}
        isPro={isPro}
        usage={usage}
      />

      {/* Main Content Area */}
      <div
        className={`
          flex-1 h-full relative transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)
          ${isMobile ? 'ml-0 w-full' : (isSidebarOpen ? 'ml-[240px]' : 'ml-[72px]')}
        `}
      >
        <main className="h-full overflow-y-auto no-scrollbar scroll-smooth pb-safe-bottom">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 min-h-full">
            {currentView === 'journal' ? (
              <JournalEditor
                initialDate={editDate || new Date().toISOString().split('T')[0]}
                onSave={updateStreak}
                onUpgrade={() => { }}
                onToggleSidebar={isMobile ? () => setIsSidebarOpen(true) : undefined}
                streak={streak}
              />
            ) : (
              <Suspense fallback={<div className="p-10 text-center text-gray-400">Loading Index...</div>}>
                <HistoryDashboard
                  onEditEntry={handleEditEntry}
                />
              </Suspense>
            )}
          </div>
        </main>
      </div>


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
}

export default App;