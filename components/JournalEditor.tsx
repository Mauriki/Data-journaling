import React, { useState, useEffect, useCallback } from 'react';
import { JournalEntry, RatingValue } from '../types';
import { saveEntry, getEntryByDate } from '../services/storageService';
import { generateInsight } from '../services/openaiService';
import { useAuth } from '../contexts/AuthContext';
import RatingInput from './RatingInput';
import RichTextEditor from './RichTextEditor';
import AudioRecorder from './AudioRecorder';
import { Calendar, Sparkles, Tag, Plus, ShieldCheck, Cloud, ArrowRight } from 'lucide-react';

interface JournalEditorProps {
  initialDate: string;
  onSave: () => void;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ initialDate, onSave }) => {
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const entry = await getEntryByDate(initialDate);
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
    init();
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleGenerateInsight = async () => {
    if (rating === null && !narrative && !reasoning && !plan) return;
    setIsGenerating(true);
    const entry: JournalEntry = {
      id: date, date, timestamp: Date.now(), narrative, rating: rating || 0, reasoning, planForTomorrow: plan, tags
    };
    const insight = await generateInsight(entry);
    setAiInsight(insight);
    entry.aiSummary = insight;
    await saveEntry(entry);
    setIsGenerating(false);
  };

  const appendNarrative = useCallback((text: string) => setNarrative(prev => prev + text), []);
  const appendReasoning = useCallback((text: string) => setReasoning(prev => prev + text), []);
  const appendPlan = useCallback((text: string) => setPlan(prev => prev + text), []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-apple-gray dark:text-zinc-500">Loading entry...</div>;
  }

  return (
    <div className="w-full pb-32 animate-fade-in">

      {/* Status Indicator */}
      {/* Status Indicator - Moved to bottom right to avoid overlap */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-none">
        <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border opacity-80 shadow-sm backdrop-blur-sm ${isGuest ? 'text-green-600 bg-green-50/90 border-green-100 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' : 'text-blue-600 bg-blue-50/90 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'}`}>
          {isGuest ? <ShieldCheck className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
          <span>{isGuest ? 'Encrypted' : 'Cloud Sync'}</span>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-500 ${saveStatus === 'saving' ? 'opacity-100 translate-y-0 bg-white/90 dark:bg-zinc-800/90 dark:border-zinc-600 dark:text-white' : saveStatus === 'unsaved' ? 'opacity-100 translate-y-0 bg-red-50/90 text-red-600 border-red-100' : 'opacity-0 translate-y-2'}`}>
          {saveStatus === 'saving' ? 'Saving...' : 'Save Failed'}
        </span>
      </div>

      {/* Header */}
      <header className="mb-10 pb-6 border-b border-gray-200/60 dark:border-white/10">
        <div className="flex items-center gap-2 text-apple-gray dark:text-zinc-400 mb-1">
          <Calendar className="w-4 h-4" />
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="bg-transparent border-none outline-none text-sm font-medium text-apple-gray dark:text-zinc-400 hover:text-apple-blue cursor-pointer uppercase tracking-wide"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-apple-text dark:text-white tracking-tight">
          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h1>
      </header>

      {/* Editor Sections */}
      <div className="space-y-12">

        <section className="group">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-xs font-bold text-apple-gray dark:text-zinc-500 uppercase tracking-widest">01 — Narrative</label>
            <AudioRecorder onTranscriptionComplete={appendNarrative} />
          </div>
          <RichTextEditor value={narrative} onChange={setNarrative} placeholder="What happened today?..." />
        </section>

        <section className="group">
          <label className="block text-xs font-bold text-apple-gray dark:text-zinc-500 uppercase tracking-widest mb-6">02 — Analysis & Mood</label>
          <div className="mb-8"><RatingInput value={rating} onChange={setRating} /></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-apple-gray dark:text-zinc-400">Reasoning</span>
            <AudioRecorder onTranscriptionComplete={appendReasoning} />
          </div>
          <RichTextEditor value={reasoning} onChange={setReasoning} placeholder="Analyze the drivers..." minHeight="80px" />
        </section>

        <section className="group">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-bold text-apple-gray dark:text-zinc-500 uppercase tracking-widest">03 — Strategy</label>
            <AudioRecorder onTranscriptionComplete={appendPlan} />
          </div>
          <RichTextEditor value={plan} onChange={setPlan} placeholder="Actionable steps..." minHeight="80px" />
        </section>

        <section className="pt-6 border-t border-gray-200/60 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-apple-gray dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 px-2 rounded-lg">
              <Tag className="w-4 h-4" />
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (() => { if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag(''); } })()}
                placeholder="Add tag"
                className="bg-transparent border-none outline-none text-sm py-1.5 min-w-[80px] placeholder:text-gray-400 focus:ring-0"
              />
              <button onClick={() => { if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag(''); } }} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 text-apple-gray"><Plus className="w-3 h-3" /></button>
            </div>
            {tags.map(tag => <span key={tag} onClick={() => setTags(tags.filter(t => t !== tag))} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-xs font-medium cursor-pointer">#{tag}</span>)}
          </div>
        </section>

        <section className="pt-8 flex justify-end">
          {!aiInsight && (
            <button
              onClick={handleGenerateInsight}
              disabled={isGenerating || (!narrative && !rating && !reasoning && !plan)}
              className="flex items-center gap-2 pl-4 pr-5 py-3 bg-apple-text dark:bg-white text-white dark:text-black rounded-full shadow-float hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {isGenerating ? <><ArrowRight className="w-4 h-4 animate-spin" /><span className="font-medium">Thinking...</span></> : <><Sparkles className="w-4 h-4" /><span className="font-medium">Generate Daily Summary</span></>}
            </button>
          )}
        </section>

        {aiInsight && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400"><Sparkles className="w-4 h-4" /><span className="text-xs font-bold uppercase">Daily Intelligence</span></div>
            <div className="prose prose-sm max-w-none text-apple-text dark:text-gray-200 font-serif">{aiInsight}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEditor;