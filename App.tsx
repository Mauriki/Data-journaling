import React, { useState, useEffect } from 'react';
import JournalEditor from './components/JournalEditor';
import HistoryDashboard from './components/HistoryDashboard';
import { Book, BarChart2, Flame } from 'lucide-react';
import { getStreak } from './services/storageService';

type View = 'journal' | 'history';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('journal');
  const [editDate, setEditDate] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const updateStreak = async () => {
    const s = await getStreak();
    setStreak(s);
  };

  useEffect(() => {
    updateStreak();
  }, [currentView]);

  const handleEditEntry = (date: string) => {
    setEditDate(date);
    setCurrentView('journal');
  };

  const handleEntrySaved = () => {
    updateStreak();
  };

  return (
    <div className="h-screen w-full flex flex-col bg-apple-bg relative">
      
      {/* Top Navigation Bar (Glassmorphism) */}
      <header className="flex-shrink-0 h-16 border-b border-gray-200/50 bg-white/70 backdrop-blur-xl z-50 flex items-center justify-between px-4 md:px-8 transition-all sticky top-0">
        
        {/* Left: Navigation Tabs (Segmented Control Style) */}
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg">
          <button 
            onClick={() => { setCurrentView('journal'); setEditDate(null); }}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-out
              ${currentView === 'journal' 
                ? 'bg-white text-apple-text shadow-sm' 
                : 'text-apple-gray hover:text-apple-text hover:bg-white/50'}
            `}
          >
            <Book className="w-4 h-4" />
            <span>Journal</span>
          </button>
          <button 
            onClick={() => setCurrentView('history')}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-out
              ${currentView === 'history' 
                ? 'bg-white text-apple-text shadow-sm' 
                : 'text-apple-gray hover:text-apple-text hover:bg-white/50'}
            `}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Index</span>
          </button>
        </div>

        {/* Right: Streak Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'fill-orange-500' : ''}`} />
            <span className="text-xs font-semibold tracking-wide">{streak} Day Streak</span>
          </div>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative scroll-smooth">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 min-h-full">
          {currentView === 'journal' ? (
            <JournalEditor 
              initialDate={editDate || new Date().toISOString().split('T')[0]} 
              onSave={handleEntrySaved}
            />
          ) : (
            <HistoryDashboard onEditEntry={handleEditEntry} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;