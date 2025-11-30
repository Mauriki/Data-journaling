import React from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import StreakFlame from './StreakFlame';
import FireArrow from './FireArrow';
import Calendar from './Calendar';

interface TopBarProps {
    date: string;
    setDate: (date: string) => void;
    showCalendar: boolean;
    setShowCalendar: (show: boolean) => void;
    entryDates: string[];
    onToggleSidebar?: () => void;
    streak: number;
    streakStatus: 'unlit' | 'igniting' | 'burning';
    displayStreak: number;
    fireArrowConfig: { start: { x: number, y: number }, end: { x: number, y: number } } | null;
    onFireArrowComplete: () => void;
    onStreakRef: (ref: HTMLDivElement | null) => void;
}

const TopBar: React.FC<TopBarProps> = ({
    date,
    setDate,
    showCalendar,
    setShowCalendar,
    entryDates,
    onToggleSidebar,
    streakStatus,
    displayStreak,
    fireArrowConfig,
    onFireArrowComplete,
    onStreakRef
}) => {
    return (
        <>
            <header className="mb-10 md:mb-16 pb-6 border-b border-apple-border/60 dark:border-white/10 animate-slide-in-from-bottom" style={{ animationDelay: '0.1s' }}>

                {/* Mobile Top Row: Menu & Streak */}
                <div className="flex md:hidden items-center justify-between mb-4">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 -ml-2 text-apple-gray dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div ref={onStreakRef} className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-800/50 shadow-sm">
                        <StreakFlame size={18} status={streakStatus} />
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{displayStreak}</span>
                    </div>
                </div>

                <div className="relative flex items-center justify-between h-[var(--header-height)]">
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="group flex items-center gap-3 text-3xl md:text-4xl font-bold text-apple-text dark:text-white tracking-tight leading-tight hover:opacity-80 transition-opacity"
                    >
                        <span>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        <ChevronDown className={`w-6 h-6 md:w-8 md:h-8 text-gray-400 transition-transform duration-300 ${showCalendar ? 'rotate-180' : ''}`} />
                    </button>

                    {showCalendar && (
                        <div className="absolute top-full left-0 mt-4 z-50">
                            <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                            <div className="relative z-50">
                                <Calendar
                                    selectedDate={date}
                                    onSelectDate={(d) => { setDate(d); setShowCalendar(false); }}
                                    entryDates={entryDates}
                                    onClose={() => setShowCalendar(false)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Desktop Streak Indicator */}
                    <div ref={onStreakRef} className="hidden md:flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-full border border-orange-100 dark:border-orange-800/50 shadow-sm">
                        <StreakFlame size={20} status={streakStatus} />
                        <span className="text-base font-bold text-orange-600 dark:text-orange-400">{displayStreak}</span>
                    </div>
                </div>
            </header>

            {/* Fire Arrow Overlay */}
            {fireArrowConfig && (
                <FireArrow
                    startPos={fireArrowConfig.start}
                    endPos={fireArrowConfig.end}
                    onComplete={onFireArrowComplete}
                />
            )}
        </>
    );
};

export default TopBar;
