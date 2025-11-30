
import React, { useState, useEffect, useCallback } from 'react';
import { JournalEntry, RatingValue } from '../types';
import { saveEntry, getEntryByDate } from '../services/storageService';

import { useAuth } from '../contexts/AuthContext';
import RatingInput from './RatingInput';
import RichTextEditor from './RichTextEditor';
import AudioRecorder from './AudioRecorder';
import { Tag, Plus, Menu, ChevronDown } from 'lucide-react';
import StreakFlame from './StreakFlame';
import FireArrow from './FireArrow';
import Calendar from './Calendar';
import { JOURNAL_PROMPTS, ANALYSIS_PROMPTS, STRATEGY_PROMPTS } from '../data/prompts';

interface JournalEditorProps {
  initialDate: string;
  onSave: () => void;
  onUpgrade?: () => void;
  onToggleSidebar?: () => void;
  streak?: number;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ initialDate, onSave, onToggleSidebar, streak = 0 }) => {
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
  const [fireArrowConfig, setFireArrowConfig] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  const streakRef = React.useRef<HTMLDivElement>(null);
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





  const appendNarrative = useCallback((text: string) => setNarrative(prev => prev + text), []);
  const appendReasoning = useCallback((text: string) => setReasoning(prev => prev + text), []);
  const appendPlan = useCallback((text: string) => setPlan(prev => prev + text), []);

  const handleIgnite = useCallback((startCoords: { x: number, y: number }) => {
    if (streakStatus !== 'unlit') return;

    // Get destination coordinates (center of streak icon)
    if (streakRef.current) {
      const rect = streakRef.current.getBoundingClientRect();
      const endCoords = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      setFireArrowConfig({ start: startCoords, end: endCoords });
      setStreakStatus('igniting');
    }
  }, [streakStatus]);

  const handleFireArrowComplete = useCallback(() => {
    setStreakStatus('burning');
    setFireArrowConfig(null);
    // Bounce animation for streak number could be added here if we had a ref to the number or a separate component
    setDisplayStreak(prev => prev + 1); // Optimistic update if needed, or just visual
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-apple-gray dark:text-zinc-500">Loading entry...</div>;
  }

  return (
    <div className="w-full pb-32 animate-fade-in">

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

      {/* Header */}
      <header className="mb-12 md:mb-16 pb-6 border-b border-gray-200/60 dark:border-white/10 animate-slide-in-from-bottom" style={{ animationDelay: '0.1s' }}>

        {/* Mobile Top Row: Menu & Streak */}
        <div className="flex md:hidden items-center justify-between mb-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-apple-gray dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div ref={streakRef} className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-800/50 shadow-sm">
            <StreakFlame size={18} status={streakStatus} />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{displayStreak}</span>
          </div>
        </div>

        <div className="relative flex items-center justify-between">
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
          <div ref={streakRef} className="hidden md:flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-full border border-orange-100 dark:border-orange-800/50 shadow-sm">
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
          onComplete={handleFireArrowComplete}
        />
      )}

      {/* Editor Sections */}
      <div className="space-y-16">

        <section className="group animate-slide-in-from-bottom" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <label className="block text-xs font-bold text-apple-gray dark:text-zinc-500 uppercase tracking-widest">01 — Narrative</label>
            <AudioRecorder onTranscriptionComplete={appendNarrative} />
          </div>
          <RichTextEditor
            value={narrative}
            onChange={setNarrative}
            animatedPlaceholder={JOURNAL_PROMPTS}
            onIgnite={handleIgnite}
            canIgnite={streakStatus === 'unlit'}
          />
        </section>

        <section className="group animate-slide-in-from-bottom" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-8">
            <label className="block text-xs font-bold text-apple-gray dark:text-zinc-500 uppercase tracking-widest">02 — Analysis & Mood</label>
            <AudioRecorder onTranscriptionComplete={appendReasoning} />
          </div>
          <div className="mb-8"><RatingInput value={rating} onChange={setRating} /></div>
          <RichTextEditor
            value={reasoning}
            onChange={setReasoning}
            minHeight="80px"
            animatedPlaceholder={ANALYSIS_PROMPTS}
            onIgnite={handleIgnite}
            canIgnite={streakStatus === 'unlit'}
          />
        </section>

        <section className="group animate-slide-in-from-bottom" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-6">
            <label className="block text-xs font-bold text-apple-gray dark:text-zinc-500 uppercase tracking-widest">03 — Strategy</label>
            <AudioRecorder onTranscriptionComplete={appendPlan} />
          </div>
          <RichTextEditor
            value={plan}
            onChange={setPlan}
            minHeight="80px"
            animatedPlaceholder={STRATEGY_PROMPTS}
            onIgnite={handleIgnite}
            canIgnite={streakStatus === 'unlit'}
          />
        </section>

        {/* 04 - Daily Summary Section REMOVED */}

        <section className="pt-8 border-t border-gray-200/60 dark:border-white/10 animate-slide-in-from-bottom" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-apple-gray dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800/80 px-4 py-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700">
              <Tag className="w-4 h-4" />
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (() => { if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag(''); } })()}
                placeholder="Add tag"
                className="bg-transparent border-none outline-none text-sm min-w-[80px] placeholder:text-gray-400 focus:ring-0"
              />
              <button onClick={() => { if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag(''); } }} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-zinc-600 text-apple-gray transition-colors"><Plus className="w-3 h-3" /></button>
            </div>
            {tags.map(tag => <span key={tag} onClick={() => setTags(tags.filter(t => t !== tag))} className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">#{tag}</span>)}
          </div>
        </section>

      </div>
    </div>
  );
};

export default JournalEditor;