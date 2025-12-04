import React, { useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import StreakFlame from './StreakFlame';
import Calendar from './Calendar';
import { MenuIcon } from './Sidebar/MenuIcon';

interface TopBarProps {
    date: string;
    setDate: (date: string) => void;
    showCalendar: boolean;
    setShowCalendar: (show: boolean) => void;
    entryDates: string[];
    onToggleSidebar?: () => void;
    isSidebarOpen?: boolean; // Add this prop
    streak: number;
    streakStatus: 'unlit' | 'igniting' | 'burning';
    displayStreak: number;
}

const TopBar: React.FC<TopBarProps> = ({
    date,
    setDate,
    showCalendar,
    setShowCalendar,
    entryDates,
    onToggleSidebar,
    isSidebarOpen = false,
    streakStatus,
    displayStreak
}) => {
    const handleToggleSidebar = useCallback(() => {
        onToggleSidebar?.();
    }, [onToggleSidebar]);

    const handleCalendarToggle = useCallback(() => {
        setShowCalendar(!showCalendar);
    }, [showCalendar, setShowCalendar]);

    const handleDateSelect = useCallback((d: string) => {
        setDate(d);
        setShowCalendar(false);
    }, [setDate, setShowCalendar]);

    const handleCalendarClose = useCallback(() => {
        setShowCalendar(false);
    }, [setShowCalendar]);

    return (
        <>
            <header className="h-[var(--header-height)] border-b border-apple-border/60 dark:border-white/10 animate-slide-in-from-bottom bg-apple-bg/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300" style={{ animationDelay: '0.1s' }}>
                <div className="mx-auto max-w-[var(--card-max-width)] px-3 md:px-[var(--space-l)] h-full flex items-center gap-4">
                    {/* Mobile/Desktop Sidebar Toggle - 2-line Minimal Icon */}
                    {/* Mobile/Tablet Sidebar Toggle */}
                    <button
                        onClick={handleToggleSidebar}
                        className="p-1.5 -ml-1 text-apple-gray dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center group md:hidden lg:hidden"
                        aria-label="Toggle sidebar"
                    >
                        <MenuIcon isOpen={isSidebarOpen} className="scale-90" />
                    </button>

                    {/* Title Area - Baseline Aligned */}
                    <div className="flex-1 flex items-center min-w-0 pt-0.5 ml-1 md:ml-0">
                        <button
                            onClick={handleCalendarToggle}
                            className="group flex items-center gap-1.5 md:gap-2 text-left hover:opacity-80 transition-opacity min-w-0"
                        >
                            <h1 className="text-xl md:text-[length:var(--font-xl)] font-bold text-apple-text dark:text-white tracking-tight leading-none truncate">
                                {/* Mobile (< 400px): Short format (Mon, Dec 4) - Larger text */}
                                <span className="sm:hidden">
                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                {/* Mobile/Tablet (400px - 768px): Full weekday if space allows */}
                                <span className="hidden sm:inline md:hidden">
                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </span>
                                {/* Desktop: Full format (Monday, December 4) */}
                                <span className="hidden md:inline">
                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </span>
                            </h1>
                            <ChevronDown className={`w-5 h-5 md:w-6 md:h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ${showCalendar ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Controls Area */}
                    <div className="flex items-center gap-2 ml-auto flex-shrink-0 pl-2">
                        <div
                            className="
                  inline-flex items-center justify-center 
                  h-[36px] lg:h-[48px] 
                  px-2.5 rounded-full 
                  bg-gradient-to-b from-[#2a1f1a] to-[#34221c] 
                  border border-white/5 
                  shadow-[0_6px_18px_rgba(0,0,0,0.45)]
                  text-white
                "
                            aria-label={`Streak ${displayStreak}`}
                        >
                            <StreakFlame size={20} status={streakStatus} className="lg:w-5 lg:h-5" />
                            <span className="text-sm lg:text-[1rem] font-medium ml-1.5">{displayStreak}</span>
                        </div>
                    </div>

                    {/* Calendar Dropdown */}
                    {showCalendar && (
                        <div className="absolute top-full left-0 mt-2 z-50 px-[var(--space-l)] w-full flex justify-center md:justify-start">
                            <div className="fixed inset-0 z-40" onClick={handleCalendarClose} />
                            <div className="relative z-50">
                                <Calendar
                                    selectedDate={date}
                                    onSelectDate={handleDateSelect}
                                    entryDates={entryDates}
                                    onClose={handleCalendarClose}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};

export default React.memo(TopBar);
