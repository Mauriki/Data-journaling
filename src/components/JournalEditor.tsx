
import React, { useState, useEffect, useCallback } from 'react';
import { JournalEntry, RatingValue } from '../types';
import { saveEntry, getEntryByDate } from '../services/storageService';

import { useAuth } from '../contexts/AuthContext';
import RatingInput from './RatingInput';
import RichTextEditor from './RichTextEditor';
import AudioRecorder from './AudioRecorder';
import { Tag, Plus } from 'lucide-react';
import TopBar from './TopBar';
import { JOURNAL_PROMPTS, ANALYSIS_PROMPTS, STRATEGY_PROMPTS } from '../data/prompts';

interface JournalEditorProps {
  initialDate: string;
  onSave: () => void;
  onUpgrade?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  streak?: number;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ initialDate, onSave, onToggleSidebar, isSidebarOpen, streak = 0 }) => {
  const { isGuest } = useAuth();
  const [date, setDate] = useState(initialDate);

  const [narrative, setNarrative] = useState('');
  const [rating, setRating] = useState<RatingValue | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [plan, setPlan] = useState('');

  const [aiInsight, setAiInsight] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [entryDates, setEntryDates] = useState<string[]>([]);

  // Fire Arrow & Streak State
  const [streakStatus, setStreakStatus] = useState<'unlit' | 'igniting' | 'burning'>('burning');
  const [displayStreak, setDisplayStreak] = useState(streak);

  useEffect(() => {
    setDisplayStreak(streak);
  }, [streak]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const entry = await getEntryByDate(initialDate);

      // Determine initial fire status
      const isToday = new Date(initialDate).toDateString() === new Date().toDateString();
      const hasContent = entry && (entry.narrative || entry.rating || entry.reasoning || entry.planForTomorrow);

      if (isToday && !hasContent) {
        setStreakStatus('unlit');
      } else {
        setStreakStatus('burning');
      }

      if (entry) {
        setNarrative(entry.narrative);
        setRating(entry.rating);
        setReasoning(entry.reasoning);
        setPlan(entry.planForTomorrow);
        setTags(entry.tags || []);
        setAiInsight(entry.aiSummary);
      } else {
        setNarrative('');
        setRating(null);
        setReasoning('');
        setPlan('');
        setTags([]);
        setAiInsight(undefined);
      }
      setLoading(false);
      setSaveStatus('saved');
    };

    const loadEntryDates = async () => {
      const entries = await import('../services/storageService').then(m => m.getEntries());
      setEntryDates(entries.map(e => e.date));
    };

    init();
    loadEntryDates();
  }, [initialDate]);

  const saveData = useCallback(async () => {
    setSaveStatus('saving');
    const entry: JournalEntry = {
      id: date,
      date,
      timestamp: Date.now(),
      narrative,
      rating: rating || 0,
      reasoning,
      planForTomorrow: plan,
      tags,
      aiSummary: aiInsight,
      encrypted: isGuest // Only locally encrypted
    };

    try {
      await saveEntry(entry);
      setTimeout(() => {
        setSaveStatus('saved');
        onSave();
      }, 1000); // Increased to 1s for smoother UI
    } catch (error) {
      console.error("Failed to save entry:", error);
      setSaveStatus('unsaved');
      alert("Failed to save entry. Please check your connection.");
    }
  }, [date, narrative, rating, reasoning, plan, tags, aiInsight, onSave, isGuest]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (narrative || reasoning || plan || rating !== null || tags.length > 0) {
        saveData();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [narrative, reasoning, plan, rating, tags, aiInsight, saveData, loading]);

  const handleTranscription = useCallback((text: string, field: 'journal' | 'analysis' | 'strategy') => {
    if (field === 'journal') {
      setNarrative(prev => prev + (prev ? ' ' : '') + text);
    } else if (field === 'analysis') {
      setReasoning(prev => prev + (prev ? ' ' : '') + text);
    } else if (field === 'strategy') {
      setPlan(prev => prev + (prev ? ' ' : '') + text);
    }
    setSaveStatus('saving');
  }, []);

  // Memoized event handlers for performance
  const handleNarrativeChange = useCallback((content: string) => {
    setNarrative(content);
    setSaveStatus('saving');
  }, []);

  const handleReasoningChange = useCallback((content: string) => {
    setReasoning(content);
    setSaveStatus('saving');
  }, []);

  const handlePlanChange = useCallback((content: string) => {
    setPlan(content);
    setSaveStatus('saving');
  }, []);

  const handleRatingChange = useCallback((r: RatingValue) => {
    setRating(r);
    setSaveStatus('saving');
  }, []);

  const handleTagAdd = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, tags]);

  const handleTagRemove = useCallback((tag: string) => {
    setTags(tags.filter(t => t !== tag));
  }, [tags]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTagAdd();
    }
  }, [handleTagAdd]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-apple-gray dark:text-zinc-500">Loading entry...</div>;
  }

  return (
    <div className="w-full pb-32 animate-fade-in @container">
      {/* Status Indicator - Removed Cloud Sync, kept Save Status only if needed, but user asked to remove "Cloud Sync" specifically. 
          I will keep the save status but remove the cloud icon part as requested. 
          Actually, the user said "remove cloud sync", implying the feature and likely the UI. 
          I'll keep the save status text for feedback but remove the "Encrypted/Cloud Sync" badge.
      */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-none">
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-500 ${saveStatus === 'saving' ? 'opacity-100 translate-y-0 bg-white/90 dark:bg-zinc-800/90 dark:border-zinc-600 dark:text-white' : saveStatus === 'unsaved' ? 'opacity-100 translate-y-0 bg-red-50/90 text-red-600 border-red-100' : 'opacity-0 translate-y-2'}`}>
          {saveStatus === 'saving' ? 'Saving...' : 'Save Failed'}
        </span>
      </div>

      <TopBar
        date={date}
        setDate={setDate}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
        entryDates={entryDates}
        onToggleSidebar={onToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        streak={streak}
        streakStatus={streakStatus}
        displayStreak={displayStreak}
      />

      {/* Editor Sections Container */}
      <div className="mx-auto max-w-[var(--card-max-width)] px-0 md:px-[var(--space-l)] space-y-4 md:space-y-[var(--space-xl)]">

        <section className="group animate-slide-in-from-bottom @container" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-[var(--space-s)]">
            <div className="flex items-center gap-2">
              <span className="text-[0.85rem] tracking-[2px] uppercase text-apple-gray dark:text-white/20 font-medium">NARRATIVE</span>
              <span className="text-sm text-apple-gray/60 dark:text-white/10">•</span>
              <span className="text-sm text-apple-gray dark:text-gray-400">What happened today?</span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <AudioRecorder onTranscriptionComplete={(text) => handleTranscription(text, 'journal')} />
            </div>
          </div>

          <div className="bg-white/50 dark:bg-white/[0.02] rounded-xl p-3 md:p-[var(--space-m)] border border-apple-border/50 dark:border-white/5 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80 dark:hover:bg-white/[0.04]">
            <RichTextEditor
              value={narrative}
              onChange={handleNarrativeChange}
              animatedPlaceholder={JOURNAL_PROMPTS}
            />
          </div>
        </section>

        <section className="group animate-slide-in-from-bottom @container" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-[var(--space-s)]">
            <div className="flex items-center gap-2">
              <span className="text-[0.85rem] tracking-[2px] uppercase text-apple-gray dark:text-white/20 font-medium">ANALYSIS & MOOD</span>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-white/[0.02] rounded-xl p-3 md:p-[var(--space-m)] border border-apple-border/50 dark:border-white/5 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80 dark:hover:bg-white/[0.04]">
            {/* Rating - First in Analysis */}
            <div className="mb-[var(--space-m)]">
              <RatingInput value={rating} onChange={handleRatingChange} />
            </div>

            <div>
              {/* Why do you feel this way? */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-apple-gray dark:text-gray-400">Why do you feel this way?</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <AudioRecorder onTranscriptionComplete={(text) => handleTranscription(text, 'analysis')} />
                  </div>
                </div>
                <RichTextEditor
                  value={reasoning}
                  onChange={handleReasoningChange}
                  animatedPlaceholder={ANALYSIS_PROMPTS}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="group animate-slide-in-from-bottom @container" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-[var(--space-s)]">
            <div className="flex items-center gap-2">
              <span className="text-[0.85rem] tracking-[2px] uppercase text-apple-gray dark:text-white/20 font-medium">STRATEGY</span>
              <span className="text-sm text-apple-gray/60 dark:text-white/10">•</span>
              <span className="text-sm text-apple-gray dark:text-gray-400">Plan for tomorrow</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <AudioRecorder onTranscriptionComplete={(text) => handleTranscription(text, 'strategy')} />
            </div>
          </div>

          <div className="bg-white/50 dark:bg-white/[0.02] rounded-xl p-3 md:p-[var(--space-m)] border border-apple-border/50 dark:border-white/5 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80 dark:hover:bg-white/[0.04]">
            <RichTextEditor
              value={plan}
              onChange={handlePlanChange}
              animatedPlaceholder={STRATEGY_PROMPTS}
            />
          </div>
        </section>
      </div>
      <section className="pt-8 mt-[var(--space-l)] border-t border-gray-200/60 dark:border-white/10 animate-slide-in-from-bottom" style={{ animationDelay: '0.6s' }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-apple-gray dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800/80 px-4 py-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700">
            <Tag className="w-4 h-4" />
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag"
              className="bg-transparent border-none outline-none text-sm min-w-[80px] placeholder:text-gray-400 focus:ring-0"
            />
            <button onClick={handleTagAdd} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-zinc-600 text-apple-gray transition-colors"><Plus className="w-3 h-3" /></button>
          </div>
          {tags.map(tag => <span key={tag} onClick={() => handleTagRemove(tag)} className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">#{tag}</span>)}
        </div>
      </section>

    </div>
  );
};

export default JournalEditor;