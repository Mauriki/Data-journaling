import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, History, Settings, ChevronLeft, Menu } from 'lucide-react';
import { User } from 'firebase/auth';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    currentView: 'journal' | 'history';
    onViewChange: (view: 'journal' | 'history') => void;
    user: User | null;
    streak: number;
    onOpenSettings: () => void;
    onOpenSleep?: () => void;
    isMobile: boolean;
    isPro?: boolean;
    usage?: { transcriptionSeconds: number; aiSummaryCount: number };
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onToggle,
    currentView,
    onViewChange,
    user,
    onOpenSettings,
    isMobile,
    isPro,
    usage
}) => {


    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onToggle}
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <aside
                className={`
          fixed top-0 left-0 h-full bg-apple-card/80 dark:bg-zinc-900/90 backdrop-blur-xl border-r border-apple-border/50 dark:border-white/10 z-50 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)
          ${isOpen ? 'w-[var(--sidebar-width)] translate-x-0' : isMobile ? 'w-[var(--sidebar-width)] -translate-x-full' : 'w-[var(--sidebar-width-collapsed)] translate-x-0'}
        `}
            >
                <div className="flex flex-col h-full pt-[var(--safe-top)] pb-[var(--safe-bottom)]">
                    {/* Header / Logo & Toggle */}
                    <div className={`flex items-center ${isOpen ? 'justify-between px-4' : 'justify-center'} h-[var(--header-height)] mb-2`}>
                        {isOpen && (
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-white font-bold text-xs shadow-md border border-white/20 overflow-hidden flex-shrink-0">
                                    {user?.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        user?.displayName ? user.displayName[0].toUpperCase() : 'M'
                                    )}
                                </div>
                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate max-w-[120px] tracking-tight">
                                    {user?.displayName?.split(' ')[0] || 'Maurik'}
                                </span>
                            </div>
                        )}

                        <button
                            onClick={onToggle}
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            {isOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
                        <NavItem
                            icon={Book}
                            label="Journal"
                            isActive={currentView === 'journal'}
                            onClick={() => { onViewChange('journal'); if (isMobile) onToggle(); }}
                            isOpen={isOpen}
                        />
                        <NavItem
                            icon={History}
                            label="History"
                            isActive={currentView === 'history'}
                            onClick={() => { onViewChange('history'); if (isMobile) onToggle(); }}
                            isOpen={isOpen}
                        />
                    </div>

                    {/* Freemium Progress (Only for Free Users) */}
                    {isOpen && !isPro && usage && (
                        <div className="px-4 py-4 mb-2">
                            <div className="bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl p-4 border border-gray-200/50 dark:border-white/5 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Free Trial</span>
                                    <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-white/10 px-2 py-0.5 rounded-md shadow-sm border border-gray-100 dark:border-white/5">
                                        Free Plan
                                    </span>
                                </div>

                                {/* Transcription Progress */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-[10px] font-medium text-gray-500 mb-1.5">
                                        <span>Voice</span>
                                        <span>{Math.min(100, Math.round(((usage.transcriptionSeconds || 0) / 300) * 100))}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, ((usage.transcriptionSeconds || 0) / 300) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-gray-200/50 dark:border-white/5 space-y-2">
                        {/* Settings */}
                        <button
                            onClick={() => { onOpenSettings(); if (isMobile) onToggle(); }}
                            className={`
                  w-full flex items-center gap-3 p-2.5 rounded-xl
                  text-gray-600 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-white/5
                  transition-colors
                  ${isOpen ? '' : 'justify-center'}
                `}
                        >
                            <Settings size={18} />
                            {isOpen && <span className="font-medium text-sm">Settings</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isOpen: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, onClick, isOpen }) => {
    return (
        <button
            onClick={onClick}
            className={`
        w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden
        ${isActive
                    ? 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
        ${isOpen ? '' : 'justify-center'}
      `}
            title={!isOpen ? label : undefined}
        >
            <Icon size={18} className={`flex-shrink-0 relative z-10 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
            {isOpen && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm whitespace-nowrap relative z-10"
                >
                    {label}
                </motion.span>
            )}
        </button>
    );
};
