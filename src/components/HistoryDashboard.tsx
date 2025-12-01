import React, { useEffect, useState } from 'react';
import { getEntries, deleteEntry } from '../services/storageService';
import { JournalEntry } from '../types';
import { Trash2 } from 'lucide-react';

interface HistoryDashboardProps {
    onEditEntry: (date: string) => void;
}

const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ onEditEntry }) => {
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
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">History</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Your past journal entries</p>
            </header>

            <div className="grid gap-4">
                {entries.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                        <p className="text-gray-500 dark:text-gray-400">No entries yet. Start journaling!</p>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div
                            key={entry.date}
                            onClick={() => onEditEntry(entry.date)}
                            className="group relative bg-white dark:bg-zinc-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 dark:border-zinc-700 hover:border-blue-500/30"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.rating > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                entry.rating < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            Rating: {entry.rating}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, entry.date)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-opacity"
                                    title="Delete Entry"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="mt-3 text-gray-600 dark:text-gray-300 line-clamp-2 text-sm">
                                <div dangerouslySetInnerHTML={{ __html: entry.narrative || entry.reasoning || "No content" }} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryDashboard;
