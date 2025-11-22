import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../types';
import { getEntries, deleteEntry } from '../services/storageService';
import { generateWeeklyReview } from '../services/openaiService';
import { Search, ChevronRight, Sparkles, Trash2, AlertTriangle, FileText } from 'lucide-react';

interface HistoryDashboardProps {
  onEditEntry: (date: string) => void;
}

const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ onEditEntry }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [review, setReview] = useState<string | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      const all = await getEntries();
      setEntries(all);
      setFilteredEntries(all);
      setLoadingData(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredEntries(entries);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const results = entries.filter(e =>
      e.narrative.toLowerCase().includes(lower) ||
      e.planForTomorrow.toLowerCase().includes(lower) ||
      e.tags?.some(t => t.toLowerCase().includes(lower))
    );
    setFilteredEntries(results);
  }, [searchTerm, entries]);

  const handleGenerateReview = async () => {
    if (entries.length === 0) return;
    setLoadingReview(true);
    const result = await generateWeeklyReview(entries.slice(0, 7));
    setReview(result);
    setLoadingReview(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, entry: JournalEntry) => {
    e.stopPropagation();
    setEntryToDelete(entry);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      await deleteEntry(entryToDelete.date);
      const newEntries = entries.filter(e => e.date !== entryToDelete.date);
      setEntries(newEntries);
      setFilteredEntries(newEntries.filter(e => !searchTerm || e.narrative.toLowerCase().includes(searchTerm.toLowerCase())));
      setEntryToDelete(null);
    }
  };

  const getPreview = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "No content";
  };

  if (loadingData) {
    return <div className="flex items-center justify-center py-20 text-apple-gray dark:text-zinc-500 animate-pulse">Accessing Secure Index...</div>;
  }

  return (
    <div className="animate-fade-in pb-20 relative text-apple-text dark:text-white">

      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-zinc-700">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Delete Entry?</h3>
              <p className="text-sm text-apple-gray dark:text-zinc-400 mb-6">Are you sure you want to delete the entry for <span className="font-semibold">{entryToDelete.date}</span>?</p>
              <div className="flex w-full gap-3">
                <button onClick={() => setEntryToDelete(null)} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-sm font-medium rounded-xl transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-red-200 dark:shadow-none">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-end justify-between mb-8 pb-4 border-b border-gray-200/60 dark:border-white/10">
        <h2 className="text-3xl font-bold tracking-tight">Index</h2>
        <div className="relative w-full max-w-xs group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 dark:bg-zinc-800/50 border border-transparent focus:bg-white dark:focus:bg-zinc-800 rounded-lg text-sm outline-none transition-all"
          />
        </div>
      </div>

      <div className="mb-10 bg-white dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple p-6 md:p-8 relative overflow-hidden group transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5 group-hover:opacity-20"><Sparkles className="w-24 h-24 text-blue-600" /></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <h3 className="font-bold text-xs uppercase tracking-widest text-apple-gray dark:text-zinc-500">Weekly Intelligence</h3>
          {!review && <button onClick={handleGenerateReview} disabled={loadingReview} className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full">{loadingReview ? "Analyzing..." : "Generate Report"}</button>}
        </div>
        {review ? <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed">{review.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}</div> : <p className="text-apple-gray dark:text-zinc-500 italic text-sm">Generate an AI summary of your recent data patterns...</p>}
      </div>

      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12"><div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-800 mb-3"><FileText className="w-6 h-6 text-gray-300 dark:text-zinc-600" /></div><p className="text-apple-gray dark:text-zinc-500 italic text-sm">No entries found.</p></div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.date} onClick={() => onEditEntry(entry.date)} className="group bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-apple rounded-2xl p-4 cursor-pointer transition-all duration-300 flex items-start justify-between">
              <div className="flex items-start flex-1 min-w-0 mr-4">
                <div className="flex flex-col items-center justify-center w-12 h-14 bg-gray-50/80 dark:bg-zinc-800 rounded-xl text-apple-gray dark:text-zinc-400 mr-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wide">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-xl font-bold leading-none mt-0.5">{new Date(entry.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="mb-1.5"><span className="font-medium text-apple-text dark:text-gray-200 block truncate text-base">{getPreview(entry.narrative)}</span></div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-apple-gray dark:text-zinc-500">
                    <span className={`font-semibold flex items-center gap-1 ${entry.rating > 0 ? 'text-green-600 dark:text-green-400' : entry.rating < 0 ? 'text-red-500 dark:text-red-400' : ''}`}>Rating: {entry.rating > 0 ? '+' : ''}{entry.rating}</span>
                    {entry.tags?.length > 0 && <span className="flex gap-1">{entry.tags.slice(0, 3).map(t => <span key={t} className="bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-gray-600 dark:text-gray-400">#{t}</span>)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 pt-3">
                <button onClick={(e) => handleDeleteClick(e, entry)} className="p-2 text-gray-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                <ChevronRight className="w-5 h-5 text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors opacity-50 group-hover:opacity-100" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryDashboard;