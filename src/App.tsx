import React, { useState, useEffect, Suspense } from 'react';
import JournalEditor from './components/JournalEditor';
import LoginPage from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import { getStreak, runMigration } from './services/storageService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar/Sidebar';

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

  // Responsive State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 600 && window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 600;
      const tablet = width >= 600 && width < 1024;

      setIsMobile(mobile);
      setIsTablet(tablet);

      // Auto-collapse logic
      if (mobile) {
        setIsSidebarOpen(false);
      } else if (tablet) {
        setIsSidebarOpen(false); // Default collapsed on tablet
      } else {
        setIsSidebarOpen(true); // Default open on desktop
      }
    };

    // Initial check
    handleResize();

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
        isTablet={isTablet}
        isPro={isPro}
        usage={usage ? { count: usage.transcriptionSeconds, limit: 300 } : undefined}
      />

      {/* Main Content Area */}
      <div
        className={`
          flex-1 h-full relative transition-all duration-300 ease-in-out
          ${isMobile ? 'ml-0 w-full' : ''}
          ${!isMobile && isTablet ? (isSidebarOpen ? 'ml-[240px]' : 'ml-[72px]') : ''}
          ${!isMobile && !isTablet ? 'ml-[260px]' : ''}
        `}
      >
        <main className="h-full overflow-y-auto no-scrollbar scroll-smooth pb-safe-bottom">
          <div className="max-w-5xl mx-auto px-3 md:px-8 py-3 md:py-6 min-h-full">
            {currentView === 'journal' ? (
              <JournalEditor
                initialDate={editDate || new Date().toISOString().split('T')[0]}
                onSave={updateStreak}
                onUpgrade={() => { }}
                onToggleSidebar={isMobile || isTablet ? () => setIsSidebarOpen(!isSidebarOpen) : undefined}
                isSidebarOpen={isSidebarOpen}
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