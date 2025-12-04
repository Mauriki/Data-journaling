import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, History, Settings, LogOut, Zap } from 'lucide-react';
import { User } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

// --- Types ---
type View = 'journal' | 'history';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    currentView: View;
    onViewChange: (view: View) => void;
    user: User | null;
    streak: number;
    onOpenSettings: () => void;
    onOpenProfile?: () => void;
    isMobile: boolean;
    isTablet: boolean; // New prop for tablet mode
    isPro?: boolean;
    usage?: { count: number; limit: number };
}

// --- Constants ---
const SIDEBAR_WIDTH_DESKTOP = 260;
const SIDEBAR_WIDTH_TABLET_OPEN = 240;
const SIDEBAR_WIDTH_TABLET_COLLAPSED = 72;

// --- Components ---

const NavItem = ({
    icon: Icon,
    label,
    active,
    onClick,
    collapsed = false
}: {
    icon: any,
    label: string,
    active?: boolean,
    onClick: () => void,
    collapsed?: boolean
}) => (
    <button
        onClick={onClick}
        className={`
      w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
      ${active
                ? 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'}
      ${collapsed ? 'justify-center px-0' : ''}
    `}
        title={collapsed ? label : undefined}
    >
        <Icon size={20} className={`transition-colors ${active ? 'text-gray-900 dark:text-white' : 'group-hover:text-gray-900 dark:group-hover:text-gray-200'}`} />
        {!collapsed && (
            <span className="truncate text-sm">{label}</span>
        )}
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onToggle,
    currentView,
    onViewChange,
    user,
    onOpenSettings,
    onOpenProfile,
    isMobile,
    isTablet
}) => {
    const { logout, usage: authUsage, isPro } = useAuth();

    // Use auth usage for the actual data (has transcriptionSeconds)
    const usageData = authUsage;

    // Handle view change wrapper
    const handleViewChange = useCallback((view: View) => {
        onViewChange(view);
        if (isMobile) onToggle(); // Close drawer on mobile selection
    }, [onViewChange, isMobile, onToggle]);

    const handleSettings = useCallback(() => {
        onOpenSettings();
        if (isMobile) onToggle();
    }, [onOpenSettings, isMobile, onToggle]);

    const handleProfileClick = useCallback(() => {
        if (onOpenProfile) {
            onOpenProfile();
            if (isMobile) onToggle();
        }
    }, [onOpenProfile, isMobile, onToggle]);

    // --- Render Content ---
    const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
        <div className="flex flex-col h-full bg-apple-bg/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border-r border-black/5 dark:border-white/5">
            {/* Header / User Profile */}
            <div
                className={`flex items-center ${collapsed ? 'justify-center p-4' : 'px-4 py-5 gap-3'} mb-2 ${onOpenProfile ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors' : ''}`}
                onClick={handleProfileClick}
                title={collapsed ? 'Edit Profile' : undefined}
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        user?.displayName?.[0]?.toUpperCase() || 'M'
                    )}
                </div>
                {!collapsed && (
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user?.displayName || 'Journaler'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Explorer Pass</p>
                    </div>
                )}
            </div>

            {/* Usage Progress Indicator */}
            {!isPro && !collapsed && usageData && (
                <div
                    onClick={handleSettings}
                    className="mx-3 mb-2 p-3 bg-gradient-to-br from-accent-cream to-accent-sand dark:from-accent-wood/20 dark:to-accent-leather/20 border border-accent-sand dark:border-accent-wood rounded-xl cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-accent-leather dark:text-accent-warm" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Voice Journaling</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                                {Math.floor(usageData.transcriptionSeconds / 60)} of 15 min used
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                                {Math.round((usageData.transcriptionSeconds / 900) * 100)}%
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${(usageData.transcriptionSeconds / 900) >= 0.8
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                    : 'bg-gradient-to-r from-accent-leather to-accent-wood'
                                    }`}
                                style={{ width: `${Math.min((usageData.transcriptionSeconds / 900) * 100, 100)}%` }}
                            />
                        </div>
                        {(usageData.transcriptionSeconds / 900) >= 0.8 && (
                            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium mt-1">
                                Loving it? Unlock unlimited →
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
                <NavItem
                    icon={Book}
                    label="Journal"
                    active={currentView === 'journal'}
                    onClick={() => handleViewChange('journal')}
                    collapsed={collapsed}
                />
                <NavItem
                    icon={History}
                    label="History"
                    active={currentView === 'history'}
                    onClick={() => handleViewChange('history')}
                    collapsed={collapsed}
                />
            </div>

            {/* Footer Actions */}
            <div className="p-3 mt-auto border-t border-black/5 dark:border-white/5 space-y-1">
                <NavItem
                    icon={Settings}
                    label="Settings"
                    onClick={handleSettings}
                    collapsed={collapsed}
                />
                <NavItem
                    icon={LogOut}
                    label="Sign Out"
                    onClick={logout}
                    collapsed={collapsed}
                />
            </div>
        </div>
    );

    // --- Mobile Drawer (0-600px) ---
    if (isMobile) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onToggle}
                            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-[2px]"
                        />
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-auto min-w-[220px] max-w-[50vw] z-50 shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        );
    }

    // --- Tablet Rail / Desktop Sidebar ---
    // On Desktop (1024+): Always visible, fixed width (260px)
    // On Tablet (600-1024): Collapsible rail (72px <-> 240px)

    const width = isTablet
        ? (isOpen ? SIDEBAR_WIDTH_TABLET_OPEN : SIDEBAR_WIDTH_TABLET_COLLAPSED)
        : SIDEBAR_WIDTH_DESKTOP;

    return (
        <motion.aside
            initial={false}
            animate={{ width }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 z-30 overflow-hidden border-r border-black/5 dark:border-white/5 bg-apple-bg dark:bg-[#1c1c1e]"
        >
            <SidebarContent collapsed={isTablet && !isOpen} />
        </motion.aside>
    );
};
