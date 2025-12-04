import React, { useEffect, useState } from 'react';
import { getEntries, deleteEntry } from '../services/storageService';
import { JournalEntry } from '../types';
import { Trash2 } from 'lucide-react';
import { MenuIcon } from './Sidebar/MenuIcon';

interface HistoryDashboardProps {
    onEditEntry: (date: string) => void;
    onToggleSidebar?: () => void;
    isSidebarOpen?: boolean;
}

const HistoryDashboard: React.FC<HistoryDashboardProps> = ({
    onEditEntry,
    onToggleSidebar,
    isSidebarOpen = false
}) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            const data = await getEntries();
            setEntries(data);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, date: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this entry?')) {
            await deleteEntry(date);
            loadEntries();
        }
    };

    if (loading) {
        return <div className="text-center text-gray-500 mt-10">Loading history...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header with Menu Button */}
            <header className="flex items-center gap-3 mb-8">
                {/* Mobile Menu Button */}
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 -ml-1 text-apple-gray dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95 md:hidden"
                        aria-label="Toggle sidebar"
                    >
                        <MenuIcon isOpen={isSidebarOpen} className="scale-90" />
                    </button>
                )}
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Your Journal</h1>
                    <p className="text-stone-500 dark:text-gray-400 mt-1">Your journey, one day at a time</p>
                </div>
            </header>

            <div className="grid gap-4">
                {entries.length === 0 ? (
                    <div className="text-center py-16 bg-accent-cream dark:bg-zinc-800 rounded-3xl border-2 border-dashed border-accent-sand dark:border-zinc-700">
                        <p className="text-stone-600 dark:text-gray-400 font-medium">No entries yet</p>
                        <p className="text-stone-400 dark:text-gray-500 text-sm mt-1">Start journaling to see your history!</p>
                    </div>
                ) : (
                    entries.map((entry, index) => (
                        <div
                            key={entry.date}
                            onClick={() => onEditEntry(entry.date)}
                            className="group relative bg-white dark:bg-zinc-800 p-5 rounded-2xl shadow-apple hover:shadow-card-hover transition-all cursor-pointer border border-stone-100 dark:border-zinc-700 hover:border-accent-leather/30 hover:-translate-y-0.5 animate-slide-in-from-bottom"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                                        {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {entry.rating !== null && entry.rating !== undefined && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.rating > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                entry.rating < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-stone-100 text-stone-700 dark:bg-zinc-700 dark:text-gray-400'
                                                }`}>
                                                Rating: {entry.rating > 0 ? `+${entry.rating}` : entry.rating}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-stone-600 dark:text-gray-300 line-clamp-2 text-sm leading-relaxed">
                                        {entry.narrative || entry.reasoning || "No content"}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, entry.date)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete Entry"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryDashboard;
